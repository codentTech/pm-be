import { Injectable } from '@nestjs/common';
import { TodoRecurrenceEntity } from 'src/core/database/entities/todo-recurrence.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class TodoRecurrenceRepository extends BaseRepository<TodoRecurrenceEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, TodoRecurrenceEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  create(data: Partial<TodoRecurrenceEntity>): TodoRecurrenceEntity {
    return this.repo.create(data);
  }

  async save(entity: TodoRecurrenceEntity): Promise<TodoRecurrenceEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: TodoRecurrenceEntity): Promise<void> {
    await this.repo.remove(entity);
  }

  async findByTodoItemId(todoItemId: string): Promise<TodoRecurrenceEntity | null> {
    return this.repo.findOne({ where: { TodoItemId: todoItemId } });
  }
}
