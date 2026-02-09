import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { TodoItemsService } from './todo-items.service';
import { CreateTodoItemDto, UpdateTodoItemDto } from './dto/todo-item.dto';
import { TodoItemQueryDto } from './dto/todo-item-query.dto';

@Controller('todo-lists/:todoListId/todo-items')
@ApiTags('Todo Items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class TodoItemsController {
  constructor(private readonly todoItemsService: TodoItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a todo item' })
  async create(
    @Param('todoListId') todoListId: string,
    @Body() dto: CreateTodoItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.todoItemsService.create(
      todoListId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Todo item created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todo items in a list (paginated)' })
  async findAll(
    @Param('todoListId') todoListId: string,
    @Query() query: TodoItemQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.todoItemsService.findAllByTodoListIdPaginated(
      todoListId,
      req.user as UserEntity,
      page,
      limit,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Todo items fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo item by ID' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.todoItemsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo item fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a todo item' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.todoItemsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo item updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo item' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.todoItemsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo item deleted successfully');
  }
}
