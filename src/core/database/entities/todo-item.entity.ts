import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { TodoPriority } from 'src/common/types/todo-priority.enum';
import { TodoStatus } from 'src/common/types/todo-status.enum';
import { BaseEntity } from './base.entity';
import { TodoListEntity } from './todo-list.entity';
import { TodoRecurrenceEntity } from './todo-recurrence.entity';

@Entity({ name: 'TodoItems' })
export class TodoItemEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => TodoListEntity, (list) => list.TodoItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'TodoListId' })
  TodoList: TodoListEntity;

  @Column({ type: 'uuid', nullable: false })
  TodoListId: string;

  @Index()
  @Column({ type: 'varchar', length: 500, nullable: false })
  Title: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  Description: string;

  @Column({ type: 'timestamp', nullable: true })
  DueDate: Date;

  @Column({ type: 'varchar', length: 20, nullable: false, default: TodoPriority.MEDIUM })
  Priority: TodoPriority;

  @Column({ type: 'varchar', length: 20, nullable: false, default: TodoStatus.TODO })
  Status: TodoStatus;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @OneToOne(() => TodoRecurrenceEntity, (rec) => rec.TodoItem, { cascade: true })
  Recurrence?: TodoRecurrenceEntity;
}
