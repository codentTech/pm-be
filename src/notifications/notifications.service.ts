import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { NotificationRepository } from 'src/common/repositories/notification.repository';
import { NotificationEntity } from 'src/core/database/entities/notification.entity';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { ProjectGateway } from 'src/websocket/project.gateway';
import { CreateNotificationDto } from 'src/common/types/create-notification.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly projectGateway: ProjectGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      UserId: dto.UserId,
      Type: dto.Type,
      Title: dto.Title,
      Body: dto.Body ?? null,
      Data: dto.Data ?? null,
      IsRead: false,
    });
    const saved = await this.notificationRepository.save(notification);
    this.projectGateway.emitNotificationToUser(dto.UserId, saved as unknown as Record<string, unknown>);
    return saved;
  }

  async findByUserId(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.notificationRepository.findByUserId(userId, limit);
  }

  async findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ) {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.notificationRepository.findByUserIdPaginated(
      userId,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  async markAsRead(id: string, user: UserEntity): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOneById(id, user.Id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.UserId !== user.Id) throw new ForbiddenException('Access denied');
    notification.IsRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(user: UserEntity): Promise<void> {
    const notifications = await this.notificationRepository.findByUserId(user.Id, 500);
    for (const n of notifications) {
      if (!n.IsRead) {
        n.IsRead = true;
        await this.notificationRepository.save(n);
      }
    }
  }
}
