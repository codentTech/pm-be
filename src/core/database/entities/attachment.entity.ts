import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CardEntity } from './card.entity';
import { AttachmentType } from 'src/common/types/attachment-type.enum';

@Entity({ name: 'Attachments' })
export class AttachmentEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => CardEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CardId' })
  Card: CardEntity;

  @Column({ type: 'uuid', nullable: false })
  CardId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  Type: AttachmentType;

  @Column({ type: 'varchar', length: 2000, nullable: false })
  Url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  FileName: string | null;

  @Column({ type: 'int', nullable: true })
  FileSize: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  MimeType: string | null;
}
