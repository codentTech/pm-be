import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  /** Notifications default to 50 per page, max 100 */
  limit?: number = 50;
}
