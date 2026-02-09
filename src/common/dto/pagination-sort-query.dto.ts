import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Extends PaginationQueryDto with sort and order.
 * Use for list endpoints that support sorting.
 */
export class PaginationSortQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sort?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
