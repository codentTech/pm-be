import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ example: 'Task title', description: 'Card title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255)
  Title: string;

  @ApiProperty({ description: 'List ID' })
  @IsUUID()
  @IsNotEmpty()
  ListId: string;

  @ApiPropertyOptional({ description: 'Card description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  Description?: string;

  @ApiPropertyOptional({ description: 'Position order', default: 0 })
  @IsOptional()
  @IsInt()
  Position?: number;

  @ApiPropertyOptional({ description: 'Due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  DueDate?: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  Description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  Position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ListId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  DueDate?: string;
}
