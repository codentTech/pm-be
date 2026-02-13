import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TicketPriority } from 'src/common/types/ticket-priority.enum';
import { TicketSeverity } from 'src/common/types/ticket-severity.enum';
import { TicketStatus } from 'src/common/types/ticket-status.enum';
import { TicketType } from 'src/common/types/ticket-type.enum';

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

  @ApiPropertyOptional({ enum: TicketType })
  @IsOptional()
  @IsEnum(TicketType)
  TicketType?: TicketType;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  Priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  Status?: TicketStatus;

  @ApiPropertyOptional({ description: 'Reporter user ID' })
  @IsOptional()
  @IsUUID()
  ReporterId?: string;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  EstimateHours?: number;

  @ApiPropertyOptional({ description: 'Sprint ID' })
  @IsOptional()
  @IsUUID()
  SprintId?: string;

  @ApiPropertyOptional({ description: 'Parent epic card ID' })
  @IsOptional()
  @IsUUID()
  ParentEpicId?: string;

  @ApiPropertyOptional({ description: 'Blocked reason (required for Blocked)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  BlockedReason?: string;

  @ApiPropertyOptional({ description: 'Acceptance criteria (required for Ready)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  AcceptanceCriteria?: string;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Bug severity' })
  @IsOptional()
  @IsEnum(TicketSeverity)
  Severity?: TicketSeverity;

  @ApiPropertyOptional({ description: 'Validation notes (required for Done)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ValidationNotes?: string;
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

  @ApiPropertyOptional({ enum: TicketType })
  @IsOptional()
  @IsEnum(TicketType)
  TicketType?: TicketType;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  Priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  Status?: TicketStatus;

  @ApiPropertyOptional({ description: 'Reporter user ID' })
  @IsOptional()
  @IsUUID()
  ReporterId?: string;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  EstimateHours?: number;

  @ApiPropertyOptional({ description: 'Sprint ID' })
  @IsOptional()
  @IsUUID()
  SprintId?: string;

  @ApiPropertyOptional({ description: 'Parent epic card ID' })
  @IsOptional()
  @IsUUID()
  ParentEpicId?: string;

  @ApiPropertyOptional({ description: 'Blocked reason' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  BlockedReason?: string;

  @ApiPropertyOptional({ description: 'Acceptance criteria' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  AcceptanceCriteria?: string;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Bug severity' })
  @IsOptional()
  @IsEnum(TicketSeverity)
  Severity?: TicketSeverity;

  @ApiPropertyOptional({ description: 'Validation notes' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ValidationNotes?: string;

  @ApiPropertyOptional({ description: 'Status transition reason' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  StatusReason?: string;

  @ApiPropertyOptional({ description: 'Label IDs to assign to card' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  LabelIds?: string[];

  @ApiPropertyOptional({ description: 'Assignee user IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  AssigneeIds?: string[];
}
