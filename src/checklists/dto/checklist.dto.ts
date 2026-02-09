import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  @ApiProperty({ description: 'Checklist title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  Title: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  Position?: number;
}

export class UpdateChecklistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  Position?: number;
}

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Item title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  Title: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  IsCompleted?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  Position?: number;
}

export class UpdateChecklistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  Title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  IsCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  Position?: number;
}
