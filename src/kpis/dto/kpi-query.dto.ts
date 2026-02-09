import { PaginationSortQueryDto } from 'src/common/dto/pagination-sort-query.dto';

export class KpiListQueryDto extends PaginationSortQueryDto {
  /** KPIs default sort by CreatedAt desc */
  sort?: string = 'CreatedAt';
  order?: 'asc' | 'desc' = 'desc';
}
