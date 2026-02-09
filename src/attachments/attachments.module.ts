import { Module } from '@nestjs/common';
import { AttachmentRepository } from 'src/common/repositories/attachment.repository';
import { CardRepository } from 'src/common/repositories/card.repository';
import { ListRepository } from 'src/common/repositories/list.repository';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentRepository, CardRepository, ListRepository],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
