import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';

@Controller('notifications')
@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user (paginated)' })
  async findAll(@Query() query: NotificationQueryDto, @Req() req: AuthenticatedRequest) {
    const userId = (req.user as UserEntity).Id;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const response = await this.notificationsService.findByUserIdPaginated(userId, page, limit);
    return new ApiResponse(true, HttpStatus.OK, 'Notifications fetched successfully', response);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const userId = (req.user as UserEntity).Id;
    const count = await this.notificationsService.countUnread(userId);
    return new ApiResponse(true, HttpStatus.OK, 'Unread count fetched', { count });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.notificationsService.markAsRead(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Notification marked as read', response);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    await this.notificationsService.markAllAsRead(req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'All notifications marked as read');
  }
}
