import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TodoPriority } from 'src/common/types/todo-priority.enum';
import { TodoStatus } from 'src/common/types/todo-status.enum';
import { TodoDueFilter } from 'src/common/types/todo-due-filter.enum';
import { TodoSortField } from 'src/common/types/todo-sort-field.enum';
import { TodoSortOrder } from 'src/common/types/todo-sort-order.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class TodoListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TodoStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @ApiPropertyOptional({ enum: TodoDueFilter, description: 'Filter by due date' })
  @IsOptional()
  @IsEnum(TodoDueFilter)
  due?: TodoDueFilter;

  @ApiPropertyOptional({ enum: TodoPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @ApiPropertyOptional({ description: 'Filter by todo list ID' })
  @IsOptional()
  @IsString()
  listId?: string;

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: TodoSortField, default: TodoSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(TodoSortField)
  sort?: TodoSortField;

  @ApiPropertyOptional({ enum: TodoSortOrder, default: TodoSortOrder.ASC })
  @IsOptional()
  @IsEnum(TodoSortOrder)
  order?: TodoSortOrder;
}
