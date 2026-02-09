import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base pagination query DTO for GET list endpoints.
 * Extend this when your endpoint needs additional filters (sort, order, search, etc.).
 *
 * @example
 * export class KpiListQueryDto extends PaginationQueryDto {
 *   @IsOptional()
 *   @IsString()
 *   search?: string;
 * }
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Computed skip value for TypeORM (0-based offset) */
  get skip(): number {
    const page = this.page ?? 1;
    const limit = this.limit ?? 20;
    return (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  }

  /** Effective take/limit value */
  get take(): number {
    return Math.min(100, Math.max(1, this.limit ?? 20));
  }
}
