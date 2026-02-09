import { NotificationType } from './notification-type.enum';

export interface CreateNotificationDto {
  UserId: string;
  Type: NotificationType | string;
  Title: string;
  Body?: string;
  Data?: Record<string, unknown>;
}
