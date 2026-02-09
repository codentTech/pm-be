import { Module } from '@nestjs/common';
import { NotificationRepository } from 'src/common/repositories/notification.repository';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [WebsocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
