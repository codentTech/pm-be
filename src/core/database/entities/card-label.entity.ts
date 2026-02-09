import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CardEntity } from './card.entity';
import { LabelEntity } from './label.entity';

@Entity({ name: 'CardLabels' })
export class CardLabelEntity {
  @PrimaryColumn({ type: 'uuid' })
  CardId: string;

  @PrimaryColumn({ type: 'uuid' })
  LabelId: string;

  @Index()
  @ManyToOne(() => CardEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CardId' })
  Card: CardEntity;

  @Index()
  @ManyToOne(() => LabelEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'LabelId' })
  Label: LabelEntity;
}
