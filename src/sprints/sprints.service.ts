import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { ProjectRepository } from 'src/common/repositories/project.repository';
import { SprintRepository } from 'src/common/repositories/sprint.repository';
import { SprintStatus } from 'src/common/types/sprint-status.enum';
import { ProjectStatus } from 'src/common/types/project-status.enum';
import { SprintEntity } from 'src/core/database/entities/sprint.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  async create(dto: CreateSprintDto, user: UserEntity): Promise<SprintEntity> {
    const project = await this.assertProjectAccess(dto.ProjectId, user);
    if (project.Status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Only Active projects can run sprints');
    }
    this.assertValidDates(dto.StartDate, dto.EndDate);

    if (dto.Status === SprintStatus.ACTIVE && !dto.CapacitySnapshot) {
      throw new BadRequestException('Capacity snapshot required when starting sprint');
    }

    const sprint = this.sprintRepository.create({
      ProjectId: dto.ProjectId,
      Name: dto.Name,
      StartDate: new Date(dto.StartDate),
      EndDate: new Date(dto.EndDate),
      Goal: dto.Goal ?? null,
      CapacitySnapshot: dto.CapacitySnapshot ?? null,
      Status: dto.Status ?? SprintStatus.PLANNED,
      CreatedBy: user,
    });

    return this.sprintRepository.save(sprint);
  }

  async findAllByProjectId(projectId: string, user: UserEntity): Promise<SprintEntity[]> {
    await this.assertProjectAccess(projectId, user);
    return this.sprintRepository.findAllByProjectId(projectId);
  }

  async findOne(id: string, user: UserEntity): Promise<SprintEntity> {
    const sprint = await this.sprintRepository.findOneById(id, ['Project', 'Project.CreatedBy']);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertProjectAccess(sprint.ProjectId, user);
    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto, user: UserEntity): Promise<SprintEntity> {
    const sprint = await this.findOne(id, user);

    if (dto.StartDate || dto.EndDate) {
      const nextStart = dto.StartDate ?? sprint.StartDate.toISOString().slice(0, 10);
      const nextEnd = dto.EndDate ?? sprint.EndDate.toISOString().slice(0, 10);
      this.assertValidDates(nextStart, nextEnd);
      sprint.StartDate = new Date(nextStart);
      sprint.EndDate = new Date(nextEnd);
    }

    if (dto.CapacitySnapshot !== undefined) {
      if (sprint.Status !== SprintStatus.PLANNED) {
        throw new BadRequestException('Capacity snapshot is locked after sprint starts');
      }
      sprint.CapacitySnapshot = dto.CapacitySnapshot ?? null;
    }

    if (dto.Status !== undefined) {
      this.assertValidStatusTransition(sprint.Status, dto.Status, sprint.CapacitySnapshot);
      sprint.Status = dto.Status;
    }

    if (dto.Name !== undefined) sprint.Name = dto.Name;
    if (dto.Goal !== undefined) sprint.Goal = dto.Goal ?? null;

    return this.sprintRepository.save(sprint);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const sprint = await this.findOne(id, user);
    await this.sprintRepository.remove(sprint);
  }

  private assertValidDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid sprint dates');
    }
    if (start > end) {
      throw new BadRequestException('Sprint start date must be before end date');
    }
  }

  private assertValidStatusTransition(
    from: SprintStatus,
    to: SprintStatus,
    capacitySnapshot: Record<string, number> | null,
  ): void {
    if (to === SprintStatus.ACTIVE && from !== SprintStatus.PLANNED) {
      throw new BadRequestException('Only Planned sprints can be activated');
    }
    if (to === SprintStatus.COMPLETED && from !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Only Active sprints can be completed');
    }
    if (to === SprintStatus.CLOSED && from !== SprintStatus.COMPLETED) {
      throw new BadRequestException('Only Completed sprints can be closed');
    }
    if (to === SprintStatus.ACTIVE && !capacitySnapshot) {
      throw new BadRequestException('Capacity snapshot required when starting sprint');
    }
  }

  private async assertProjectAccess(projectId: string, user: UserEntity) {
    const project = await this.projectRepository.findOneById(projectId, ['CreatedBy']);
    if (!project) throw new NotFoundException('Project not found');
    if (project.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(user.Id, project.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (project.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException('Access denied');
    }
    return project;
  }
}
