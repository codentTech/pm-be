import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DailyUpdateRole } from 'src/common/types/daily-update-role.enum';
import { DailyUpdateStatus } from 'src/common/types/daily-update-status.enum';
import { DailyUpdateWorkItemDto } from './daily-update-work-item.dto';

export class CreateDailyUpdateDto {
  @ApiProperty()
  @IsDateString()
  Date: string;

  @ApiProperty()
  @IsEnum(DailyUpdateRole)
  Role: DailyUpdateRole;

  @ApiProperty()
  @IsEnum(DailyUpdateStatus)
  OverallStatus: DailyUpdateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(0)
  TotalTimeSpent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NextDayPlan?: string;

  @ApiProperty({ type: [DailyUpdateWorkItemDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DailyUpdateWorkItemDto)
  WorkItems: DailyUpdateWorkItemDto[];
}

export class UpdateDailyUpdateDto extends PartialType(CreateDailyUpdateDto) {}
