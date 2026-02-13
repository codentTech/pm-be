import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { ProjectEntity } from "./project.entity";
import { WikiAttachmentEntity } from "./wiki-attachment.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "WikiPages" })
@Index("IDX_WIKI_PROJECT_SLUG", ["ProjectId", "Slug"], { unique: true })
export class WikiPageEntity extends BaseEntity {
  /* ----------------------------- Relations ----------------------------- */

  @ManyToOne(() => ProjectEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ProjectId" })
  Project: ProjectEntity;

  @OneToMany(() => WikiAttachmentEntity, (attachment) => attachment.Page, {
    cascade: true,
  })
  Attachments: WikiAttachmentEntity[];

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "CreatedById" })
  CreatedBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "UpdatedById" })
  UpdatedBy: UserEntity | null;

  /* ----------------------------- Columns ----------------------------- */

  @Column({ type: "uuid" })
  ProjectId: string;

  @Column({ type: "varchar", length: 200 })
  Title: string;

  @Column({ type: "varchar", length: 200 })
  Slug: string;

  @Column({ type: "text", nullable: true })
  Content: string | null;

  @Column({ type: "uuid" })
  CreatedById: string;

  @Column({ type: "uuid", nullable: true })
  UpdatedById: string | null;
}
