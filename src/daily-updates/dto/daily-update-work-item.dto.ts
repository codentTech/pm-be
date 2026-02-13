import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BlockerType } from 'src/common/types/blocker-type.enum';
import { WorkItemStatus } from 'src/common/types/work-item-status.enum';

export class DailyUpdateWorkItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  Type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ReferenceId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  Description: string;

  @ApiProperty()
  @IsEnum(WorkItemStatus)
  Status: WorkItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(0)
  TimeSpent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(BlockerType)
  BlockerType?: BlockerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  BlockerReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ExpectedResolutionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Comments?: string;
}
