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
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { BoardListQueryDto } from './dto/board-query.dto';

@Controller('boards')
@ApiTags('Boards')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a board' })
  async create(@Body() dto: CreateBoardDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.boardsService.create(dto, req.user as UserEntity, orgId);
    return new ApiResponse(true, HttpStatus.CREATED, 'Board created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards for the current user (paginated)' })
  async findAll(@Query() query: BoardListQueryDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.boardsService.findAllPaginated(
      req.user as UserEntity,
      orgId,
      page,
      limit,
      query.sort,
      query.order,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Boards fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board by ID with lists and cards' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.boardsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Board fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a board' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.boardsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Board updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.boardsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Board deleted successfully');
  }
}
