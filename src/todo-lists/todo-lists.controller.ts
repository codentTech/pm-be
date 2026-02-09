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
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { TodoListsService } from './todo-lists.service';
import { CreateTodoListDto, UpdateTodoListDto } from './dto/todo-list.dto';
import { TodoListQueryDto } from './dto/todo-list-query.dto';

@Controller('todo-lists')
@ApiTags('Todo Lists')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class TodoListsController {
  constructor(private readonly todoListsService: TodoListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a todo list' })
  async create(@Body() dto: CreateTodoListDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.todoListsService.create(dto, req.user as UserEntity, orgId);
    return new ApiResponse(true, HttpStatus.CREATED, 'Todo list created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todo lists for the current organization (paginated)' })
  async findAll(@Query() query: TodoListQueryDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const hasFilters =
      !!(query?.status || query?.due || query?.priority || query?.listId || query?.search?.trim());
    const response = hasFilters
      ? await this.todoListsService.findAllWithFilters(req.user as UserEntity, orgId, query)
      : await this.todoListsService.findAllPaginated(
          req.user as UserEntity,
          orgId,
          query,
        );
    return new ApiResponse(true, HttpStatus.OK, 'Todo lists fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo list by ID with items' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.todoListsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo list fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a todo list' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoListDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.todoListsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo list updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo list' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.todoListsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Todo list deleted successfully');
  }
}
