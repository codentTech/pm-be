import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { ProjectGateway } from 'src/websocket/project.gateway';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ListEntity } from 'src/core/database/entities/list.entity';
import { CreateListDto, UpdateListDto } from './dto/list.dto';

@Injectable()
export class ListsService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectGateway: ProjectGateway,
  ) {}

  async create(dto: CreateListDto, user: UserEntity): Promise<ListEntity> {
    await this.assertProjectOwnership(dto.ProjectId, user.Id);

    const position =
      dto.Position ??
      (await this.listRepository.getNextPositionForProject(dto.ProjectId));
    const list = this.listRepository.create({
      ...dto,
      Position: position,
      CreatedBy: user,
    });
    return this.listRepository.save(list);
  }

  async findAllByProjectId(projectId: string, user: UserEntity): Promise<ListEntity[]> {
    await this.assertProjectOwnership(projectId, user.Id);
    return this.listRepository.findAllByProjectId(projectId);
  }

  async findOne(id: string, user: UserEntity): Promise<ListEntity> {
    const list = await this.listRepository.findOneById(id, [
      'Project',
      'Project.CreatedBy',
      'Cards',
    ]);
    if (!list) throw new NotFoundException('List not found');
    if (list.Project?.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('Access denied');
    }
    return list;
  }

  async update(id: string, dto: UpdateListDto, user: UserEntity): Promise<ListEntity> {
    const list = await this.findOne(id, user);
    Object.assign(list, dto);
    return this.listRepository.save(list);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const list = await this.findOne(id, user);
    const projectId = list.ProjectId;
    await this.listRepository.remove(list);
    if (projectId) {
      this.projectGateway.emitListDeleted(projectId, { listId: id });
    }
  }

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOneById(projectId, ['CreatedBy']);
    if (!project) throw new NotFoundException('Project not found');
    if (project.CreatedBy?.Id !== userId) throw new ForbiddenException('Access denied');
  }
}
