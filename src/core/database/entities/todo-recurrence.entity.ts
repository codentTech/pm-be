import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { RecurrenceEndType } from 'src/common/types/recurrence-end-type.enum';
import { RecurrenceType } from 'src/common/types/recurrence-type.enum';
import { BaseEntity } from './base.entity';
import { TodoItemEntity } from './todo-item.entity';

@Entity({ name: 'TodoRecurrences' })
export class TodoRecurrenceEntity extends BaseEntity {
  @Index({ unique: true })
  @OneToOne(() => TodoItemEntity, (item) => item.Recurrence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'TodoItemId' })
  TodoItem: TodoItemEntity;

  @Column({ type: 'uuid', nullable: false })
  TodoItemId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  RecurrenceType: RecurrenceType;

  @Column({ type: 'int', default: 1 })
  Interval: number;

  @Column({ type: 'simple-json', nullable: true })
  DaysOfWeek: number[] | null;

  @Column({ type: 'int', nullable: true })
  DayOfMonth: number | null;

  @Column({ type: 'int', nullable: true })
  Month: number | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: RecurrenceEndType.NEVER })
  EndType: RecurrenceEndType;

  @Column({ type: 'int', nullable: true })
  EndAfterCount: number | null;

  @Column({ type: 'timestamp', nullable: true })
  EndDate: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  CronExpression: string | null;
}
