import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Matches, Min } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Inc', description: 'Organization name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiPropertyOptional({ example: 'acme-inc', description: 'URL-friendly slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  Slug?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  LogoUrl?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Inc Updated' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional({ example: 'acme-inc-updated' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  Slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  LogoUrl?: string;

  @ApiPropertyOptional({ description: 'Draft aging days', default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  DraftAgingDays?: number;

  @ApiPropertyOptional({ description: 'Follow-up SLA days', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  FollowUpSlaDays?: number;

  @ApiPropertyOptional({ description: 'Ghosted suggestion days', default: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  GhostedSuggestDays?: number;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'member', description: 'Role: owner, admin, member, guest' })
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  Role: string;
}
