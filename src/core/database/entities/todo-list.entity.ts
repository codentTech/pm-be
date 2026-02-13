import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';
import { OrganizationEntity } from './organization.entity';
import { TodoItemEntity } from './todo-item.entity';

@Entity({ name: 'TodoLists' })
export class TodoListEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'OrganizationId' })
  Organization: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  OrganizationId: string | null;

  @ManyToOne(() => ProjectEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ProjectId' })
  Project: ProjectEntity;

  @Column({ type: 'uuid', nullable: true })
  ProjectId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  Name: string;

  @Column({ type: 'int', default: 0 })
  Position: number;

  @OneToMany(() => TodoItemEntity, (item) => item.TodoList)
  TodoItems: TodoItemEntity[];
}
