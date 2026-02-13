import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RecurrenceEndType } from 'src/common/types/recurrence-end-type.enum';
import { RecurrenceType } from 'src/common/types/recurrence-type.enum';
import { TodoPriority } from 'src/common/types/todo-priority.enum';
import { TodoStatus } from 'src/common/types/todo-status.enum';

export class RecurrenceDto {
  @ApiProperty({ enum: RecurrenceType })
  @IsEnum(RecurrenceType)
  RecurrenceType: RecurrenceType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  Interval?: number;

  @ApiPropertyOptional({ description: 'Days of week 0-6 (Sun-Sat)' })
  @IsOptional()
  DaysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Day of month 1-31' })
  @IsOptional()
  @IsNumber()
  DayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Month 1-12' })
  @IsOptional()
  @IsNumber()
  Month?: number;

  @ApiPropertyOptional({ enum: RecurrenceEndType, default: RecurrenceEndType.NEVER })
  @IsOptional()
  @IsEnum(RecurrenceEndType)
  EndType?: RecurrenceEndType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  EndAfterCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  EndDate?: string;

  @ApiPropertyOptional({ description: 'Cron expression for advanced' })
  @IsOptional()
  @MaxLength(100)
  CronExpression?: string;
}

export class CreateTodoItemDto {
  @ApiProperty({ example: 'Complete report', description: 'Todo item title' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(500)
  Title: string;

  @ApiPropertyOptional({ description: 'Todo item description' })
  @IsOptional()
  @MaxLength(2000)
  Description?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  DueDate?: string;

  @ApiPropertyOptional({ enum: TodoPriority, default: TodoPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TodoPriority)
  Priority?: TodoPriority;

  @ApiPropertyOptional({ enum: TodoStatus, default: TodoStatus.TODO })
  @IsOptional()
  @IsEnum(TodoStatus)
  Status?: TodoStatus;

  @ApiPropertyOptional({ description: 'Position for ordering', default: 0 })
  @IsOptional()
  Position?: number;

  @ApiPropertyOptional({ description: 'Recurrence rule' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  Recurrence?: RecurrenceDto;

  @ApiPropertyOptional({ description: 'Linked bid ID' })
  @IsOptional()
  @IsUUID()
  BidId?: string;
}

export class UpdateTodoItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(500)
  Title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(2000)
  Description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  DueDate?: string;

  @ApiPropertyOptional({ enum: TodoPriority })
  @IsOptional()
  @IsEnum(TodoPriority)
  Priority?: TodoPriority;

  @ApiPropertyOptional({ enum: TodoStatus })
  @IsOptional()
  @IsEnum(TodoStatus)
  Status?: TodoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  Position?: number;

  @ApiPropertyOptional({ description: 'Move to another todo list' })
  @IsOptional()
  @IsUUID()
  TodoListId?: string;

  @ApiPropertyOptional({ description: 'Recurrence rule' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  Recurrence?: RecurrenceDto | null;

  @ApiPropertyOptional({ description: 'Linked bid ID' })
  @IsOptional()
  @IsUUID()
  BidId?: string | null;
}
