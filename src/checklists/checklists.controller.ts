import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistDto,
  UpdateChecklistItemDto,
} from './dto/checklist.dto';

@Controller('cards/:cardId/checklists')
@ApiTags('Checklists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create checklist' })
  async createChecklist(
    @Param('cardId') cardId: string,
    @Body() dto: CreateChecklistDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.checklistsService.createChecklist(
      cardId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Checklist created', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get checklists for card' })
  async findByCardId(
    @Param('cardId') cardId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.checklistsService.findByCardId(
      cardId,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Checklists fetched', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update checklist' })
  async updateChecklist(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.checklistsService.updateChecklist(
      id,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Checklist updated', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete checklist' })
  async removeChecklist(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.checklistsService.removeChecklist(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Checklist deleted');
  }

  @Post(':checklistId/items')
  @ApiOperation({ summary: 'Add item to checklist' })
  async createItem(
    @Param('checklistId') checklistId: string,
    @Body() dto: CreateChecklistItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.checklistsService.createItem(
      checklistId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Item added', response);
  }

  @Put(':checklistId/items/:itemId')
  @ApiOperation({ summary: 'Update checklist item' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.checklistsService.updateItem(
      itemId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Item updated', response);
  }

  @Delete(':checklistId/items/:itemId')
  @ApiOperation({ summary: 'Delete checklist item' })
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.checklistsService.removeItem(itemId, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Item deleted');
  }
}
