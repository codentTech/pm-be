import { PaginationSortQueryDto } from 'src/common/dto/pagination-sort-query.dto';

export class ProjectListQueryDto extends PaginationSortQueryDto {
  /** Projects default sort by CreatedAt desc */
  sort?: string = 'CreatedAt';
  order?: 'asc' | 'desc' = 'desc';
}
