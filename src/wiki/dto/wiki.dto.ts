import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateWikiPageDto {
  @ApiProperty({ description: "Page title" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  Title: string;

  @ApiPropertyOptional({ description: "Optional slug override" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  Slug?: string;

  @ApiProperty({ description: "Markdown content" })
  @IsString()
  @IsNotEmpty()
  Content: string;
}

export class UpdateWikiPageDto extends PartialType(CreateWikiPageDto) {
  @ApiProperty({ description: "Page ID" })
  @IsUUID()
  PageId: string;
}
