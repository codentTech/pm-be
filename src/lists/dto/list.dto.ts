import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateListDto {
  @ApiProperty({ example: 'To Do', description: 'List title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255)
  Title: string;

  @ApiProperty({ description: 'Board ID' })
  @IsUUID()
  @IsNotEmpty()
  BoardId: string;

  @ApiPropertyOptional({ description: 'Position order', default: 0 })
  @IsOptional()
  @IsInt()
  Position?: number;
}

export class UpdateListDto {
  @ApiPropertyOptional({ example: 'In Progress' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  Position?: number;
}
