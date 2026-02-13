import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProjectDeliveryType } from 'src/common/types/project-delivery-type.enum';
import { ProjectRiskLevel } from 'src/common/types/project-risk-level.enum';
import { ProjectStatus } from 'src/common/types/project-status.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project', description: 'Project name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255)
  Name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  Description?: string;

  @ApiPropertyOptional({ description: 'Organization ID (uses default org if omitted)' })
  @IsOptional()
  @IsUUID()
  OrganizationId?: string;

  @ApiPropertyOptional({ description: 'Client name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ClientDisplayName?: string;

  @ApiPropertyOptional({ description: 'Project owner (PM) user ID' })
  @IsOptional()
  @IsUUID()
  ProjectOwnerId?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  StartDate?: string;

  @ApiPropertyOptional({ enum: ProjectDeliveryType })
  @IsOptional()
  @IsEnum(ProjectDeliveryType)
  DeliveryType?: ProjectDeliveryType;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  Status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectRiskLevel })
  @IsOptional()
  @IsEnum(ProjectRiskLevel)
  RiskLevel?: ProjectRiskLevel;

  @ApiPropertyOptional({ description: 'External reference ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ExternalReferenceId?: string;

  @ApiPropertyOptional({ description: 'Budget (read-only)' })
  @IsOptional()
  Budget?: number;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Updated Project' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  Description?: string;

  @ApiPropertyOptional({ description: 'Client name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ClientDisplayName?: string;

  @ApiPropertyOptional({ description: 'Project owner (PM) user ID' })
  @IsOptional()
  @IsUUID()
  ProjectOwnerId?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  StartDate?: string;

  @ApiPropertyOptional({ enum: ProjectDeliveryType })
  @IsOptional()
  @IsEnum(ProjectDeliveryType)
  DeliveryType?: ProjectDeliveryType;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  Status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectRiskLevel })
  @IsOptional()
  @IsEnum(ProjectRiskLevel)
  RiskLevel?: ProjectRiskLevel;

  @ApiPropertyOptional({ description: 'External reference ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ExternalReferenceId?: string;
}
