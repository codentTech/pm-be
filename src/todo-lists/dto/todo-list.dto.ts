import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateTodoListDto {
  @ApiPropertyOptional({ description: 'Organization ID (defaults to current org from header)' })
  @IsOptional()
  @IsUUID()
  OrganizationId?: string;

  @ApiPropertyOptional({ description: 'Optional board/project to link this list to' })
  @IsOptional()
  @IsUUID()
  BoardId?: string;

  @ApiProperty({ example: 'My Tasks', description: 'Todo list name' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiPropertyOptional({ description: 'Position for ordering', default: 0 })
  @IsOptional()
  @IsNumber()
  Position?: number;
}

export class UpdateTodoListDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  BoardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  Position?: number;
}
