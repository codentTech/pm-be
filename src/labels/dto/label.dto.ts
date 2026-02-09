import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ example: 'Urgent', description: 'Label name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  Name: string;

  @ApiPropertyOptional({ example: '#ef4444', description: 'Hex color' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex (e.g. #ef4444)' })
  Color?: string;
}

export class UpdateLabelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex' })
  Color?: string;
}
