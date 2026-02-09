import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { AttachmentQueryDto } from './dto/attachment-query.dto';

@Controller('cards/:cardId/attachments')
@ApiTags('Attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'cards', req.params.cardId);
          fs.mkdirSync(uploadsDir, { recursive: true });
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const baseName = path.basename(file.originalname, ext);
          const safeName = `${baseName}-${Date.now()}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, safeName);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload file attachment to card' })
  async upload(
    @Param('cardId') cardId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.attachmentsService.uploadFile(
      cardId,
      file,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Attachment uploaded', response);
  }

  @Post()
  @ApiOperation({ summary: 'Add attachment to card' })
  async create(
    @Param('cardId') cardId: string,
    @Body() dto: CreateAttachmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.attachmentsService.create(
      cardId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Attachment added', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get attachments for card (paginated)' })
  async findByCardId(
    @Param('cardId') cardId: string,
    @Query() query: AttachmentQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.attachmentsService.findByCardIdPaginated(
      cardId,
      req.user as UserEntity,
      page,
      limit,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Attachments fetched', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.attachmentsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Attachment deleted');
  }
}
