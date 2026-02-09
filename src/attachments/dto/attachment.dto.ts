import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { AttachmentType } from 'src/common/types/attachment-type.enum';

export class CreateAttachmentDto {
  @ApiProperty({ enum: AttachmentType })
  @IsEnum(AttachmentType)
  Type: AttachmentType;

  @ApiProperty({ description: 'URL for link type, or file URL after upload' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  Url: string;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  FileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  FileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  MimeType?: string;
}
