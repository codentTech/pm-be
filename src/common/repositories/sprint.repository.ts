import { Injectable } from '@nestjs/common';
import { SprintEntity } from 'src/core/database/entities/sprint.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class SprintRepository extends BaseRepository<SprintEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, SprintEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByProjectId(projectId: string): Promise<SprintEntity[]> {
    return this.repo.find({
      where: { ProjectId: projectId },
      order: { StartDate: 'ASC' },
    });
  }

  async findOneById(id: string, relations?: string[]): Promise<SprintEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: relations?.length ? relations : undefined,
    });
  }

  create(data: Partial<SprintEntity>): SprintEntity {
    return this.repo.create(data);
  }

  async save(entity: SprintEntity): Promise<SprintEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: SprintEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
