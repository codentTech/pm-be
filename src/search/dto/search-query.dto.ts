import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchResultType } from 'src/common/types/search-result-type.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search query', example: 'meeting notes' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ enum: SearchResultType, description: 'Filter by result type' })
  @IsOptional()
  @IsEnum(SearchResultType)
  type?: SearchResultType;

  @ApiPropertyOptional({ description: 'Filter by organization ID' })
  @IsOptional()
  @IsUUID()
  orgId?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Search limits results per type (1-50), override parent limit */
  @ApiPropertyOptional({ description: 'Max results per type (1-50)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
