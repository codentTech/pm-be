import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { KpiPeriod } from 'src/common/types/kpi-period.enum';

export class CreateKpiDto {
  @ApiPropertyOptional({ description: 'Organization ID (defaults to current org from header)' })
  @IsOptional()
  @IsUUID()
  OrganizationId?: string;
  @ApiProperty({ example: 'Revenue', description: 'KPI name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiPropertyOptional({ example: 0, description: 'Metric value', default: 0 })
  @IsOptional()
  @IsNumber()
  Value?: number;

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

  @ApiPropertyOptional({ description: 'Metric value' })
  @IsOptional()
  @IsNumber()
  Value?: number;

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
