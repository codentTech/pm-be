import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { WikiPageEntity } from "./wiki-page.entity";
import { AttachmentType } from "src/common/types/attachment-type.enum";
import { UserEntity } from "./user.entity";

@Entity({ name: "WikiAttachments" })
@Index("IDX_WIKI_PAGE", ["WikiPageId"])
export class WikiAttachmentEntity extends BaseEntity {
  /* ----------------------------- Relations ----------------------------- */

  @ManyToOne(() => WikiPageEntity, (page) => page.Attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "WikiPageId" })
  Page: WikiPageEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "CreatedById" })
  CreatedBy: UserEntity;

  /* ----------------------------- Columns ----------------------------- */

  @Column({ type: "uuid" })
  WikiPageId: string;

  @Column({ type: "uuid" })
  ProjectId: string;

  @Column({ type: "varchar", length: 20 })
  Type: AttachmentType;

  @Column({ type: "varchar", length: 2000 })
  Url: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  FileName: string | null;

  @Column({ type: "int", nullable: true })
  FileSize: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  MimeType: string | null;

  @Column({ type: "uuid" })
  CreatedById: string;
}
