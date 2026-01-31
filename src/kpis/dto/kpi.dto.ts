import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { KpiPeriod } from 'src/core/database/entities/kpi.entity';

export class CreateKpiDto {
  @ApiProperty({ example: 'Revenue', description: 'KPI name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiProperty({ example: 10000, description: 'Target value' })
  @IsNumber()
  @IsNotEmpty()
  TargetValue: number;

  @ApiPropertyOptional({ example: 0, description: 'Current value', default: 0 })
  @IsOptional()
  @IsNumber()
  CurrentValue?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Unit' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  Unit?: string;

  @ApiProperty({ enum: KpiPeriod, default: KpiPeriod.MONTHLY })
  @IsEnum(KpiPeriod)
  @IsNotEmpty()
  Period: KpiPeriod;

  @ApiPropertyOptional({ description: 'Due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  DueDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notes?: string;
}

export class UpdateKpiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  TargetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  CurrentValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  Unit?: string;

  @ApiPropertyOptional({ enum: KpiPeriod })
  @IsOptional()
  @IsEnum(KpiPeriod)
  Period?: KpiPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  DueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notes?: string;
}
