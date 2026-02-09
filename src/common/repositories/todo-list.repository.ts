import { Injectable } from '@nestjs/common';
import { TodoListEntity } from 'src/core/database/entities/todo-list.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class TodoListRepository extends BaseRepository<TodoListEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, TodoListEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByOrg(orgId: string): Promise<TodoListEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId },
      relations: ['TodoItems', 'TodoItems.Recurrence'],
      order: { Position: 'ASC', CreatedAt: 'ASC' },
    });
  }

  async findAllByOrgPaginated(
    orgId: string,
    skip: number,
    take: number,
  ): Promise<[TodoListEntity[], number]> {
    return this.repo.findAndCount({
      where: { OrganizationId: orgId },
      relations: ['TodoItems', 'TodoItems.Recurrence'],
      order: { Position: 'ASC', CreatedAt: 'ASC' },
      skip,
      take,
    });
  }

  async findOneById(id: string): Promise<TodoListEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['TodoItems', 'TodoItems.Recurrence', 'Organization', 'Board'],
    });
  }

  create(data: Partial<TodoListEntity>): TodoListEntity {
    return this.repo.create(data);
  }

  async save(entity: TodoListEntity): Promise<TodoListEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: TodoListEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
