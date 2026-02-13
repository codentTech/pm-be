import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttachmentRepository } from 'src/common/repositories/attachment.repository';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { AttachmentEntity } from 'src/core/database/entities/attachment.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { AttachmentType } from 'src/common/types/attachment-type.enum';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {
    const cardsDir = path.join(this.uploadsDir, 'cards');
    if (!fs.existsSync(cardsDir)) {
      fs.mkdirSync(cardsDir, { recursive: true });
    }
  }

  private async ensureCardAccess(cardId: string, userId: string): Promise<void> {
    const card = await this.cardRepository.findOneById(cardId, [
      'List',
      'List.Project',
    ]);
    if (!card) throw new NotFoundException('Card not found');
    const project = card.List?.Project;
    if (project?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(userId, project.OrganizationId);
      if (!isMember) throw new ForbiddenException('Access denied');
    } else if (project?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async uploadFile(
    cardId: string,
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<AttachmentEntity> {
    await this.ensureCardAccess(cardId, user.Id);
    if (!file) {
      throw new ForbiddenException('No file provided');
    }
    const relativeUrl = `/uploads/cards/${cardId}/${file.filename}`;
    const attachment = this.attachmentRepository.create({
      CardId: cardId,
      Type: AttachmentType.FILE,
      Url: relativeUrl,
      FileName: file.originalname,
      FileSize: file.size,
      MimeType: file.mimetype,
      CreatedBy: user,
    });
    return this.attachmentRepository.save(attachment);
  }

  async create(
    cardId: string,
    dto: CreateAttachmentDto,
    user: UserEntity,
  ): Promise<AttachmentEntity> {
    await this.ensureCardAccess(cardId, user.Id);
    const attachment = this.attachmentRepository.create({
      CardId: cardId,
      Type: dto.Type,
      Url: dto.Url,
      FileName: dto.FileName ?? null,
      FileSize: dto.FileSize ?? null,
      MimeType: dto.MimeType ?? null,
      CreatedBy: user,
    });
    return this.attachmentRepository.save(attachment);
  }

  async findByCardId(cardId: string, user: UserEntity): Promise<AttachmentEntity[]> {
    await this.ensureCardAccess(cardId, user.Id);
    return this.attachmentRepository.findByCardId(cardId);
  }

  async findByCardIdPaginated(
    cardId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.ensureCardAccess(cardId, user.Id);
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.attachmentRepository.findByCardIdPaginated(
      cardId,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const attachment = await this.attachmentRepository.findOneById(id);
    if (!attachment) throw new NotFoundException('Attachment not found');
    await this.ensureCardAccess(attachment.CardId, user.Id);
    await this.attachmentRepository.remove(attachment);
  }
}
