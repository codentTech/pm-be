import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BidStatus } from 'src/common/types/bid-status.enum';
import { PaginationSortQueryDto } from 'src/common/dto/pagination-sort-query.dto';

export class BidListQueryDto extends PaginationSortQueryDto {
  @ApiPropertyOptional({ enum: BidStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;
}
