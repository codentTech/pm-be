import { Injectable } from '@nestjs/common';
import { TodoItemEntity } from 'src/core/database/entities/todo-item.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class TodoItemRepository extends BaseRepository<TodoItemEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, TodoItemEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findAllByTodoListId(todoListId: string): Promise<TodoItemEntity[]> {
    return this.repo.find({
      where: { TodoListId: todoListId },
      relations: ['Recurrence'],
      order: { Position: 'ASC', CreatedAt: 'ASC' },
    });
  }

  async findAllByTodoListIdPaginated(
    todoListId: string,
    skip: number,
    take: number,
  ): Promise<[TodoItemEntity[], number]> {
    return this.repo.findAndCount({
      where: { TodoListId: todoListId },
      relations: ['Recurrence'],
      order: { Position: 'ASC', CreatedAt: 'ASC' },
      skip,
      take,
    });
  }

  async findOneById(id: string): Promise<TodoItemEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['TodoList', 'Recurrence'],
    });
  }

  create(data: Partial<TodoItemEntity>): TodoItemEntity {
    return this.repo.create(data);
  }

  async save(entity: TodoItemEntity): Promise<TodoItemEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: TodoItemEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
