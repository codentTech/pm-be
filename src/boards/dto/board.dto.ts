import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Board', description: 'Board name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiPropertyOptional({ description: 'Board description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  Description?: string;

  @ApiPropertyOptional({ description: 'Organization ID (uses default org if omitted)' })
  @IsOptional()
  @IsUUID()
  OrganizationId?: string;
}

export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'Updated Board' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  Description?: string;
}
