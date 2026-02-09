import { PaginationSortQueryDto } from 'src/common/dto/pagination-sort-query.dto';

export class BoardListQueryDto extends PaginationSortQueryDto {
  /** Boards default sort by CreatedAt desc */
  sort?: string = 'CreatedAt';
  order?: 'asc' | 'desc' = 'desc';
}
