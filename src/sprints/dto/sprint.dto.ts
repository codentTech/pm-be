import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { SprintStatus } from 'src/common/types/sprint-status.enum';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  Name: string;

  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  @IsNotEmpty()
  ProjectId: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  StartDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  EndDate: string;

  @ApiPropertyOptional({ description: 'Sprint goal' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  Goal?: string;

  @ApiPropertyOptional({ description: 'Capacity snapshot { userId: hours }' })
  @IsOptional()
  @IsObject()
  CapacitySnapshot?: Record<string, number>;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  Status?: SprintStatus;
}

export class UpdateSprintDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  StartDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  EndDate?: string;

  @ApiPropertyOptional({ description: 'Sprint goal' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  Goal?: string;

  @ApiPropertyOptional({ description: 'Capacity snapshot { userId: hours }' })
  @IsOptional()
  @IsObject()
  CapacitySnapshot?: Record<string, number>;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  Status?: SprintStatus;
}
