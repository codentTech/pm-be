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
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';

@Controller('lists')
@ApiTags('Lists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a list' })
  async create(@Body() dto: CreateListDto, @Req() req: AuthenticatedRequest) {
    const response = await this.listsService.create(dto, req.user);
    return new ApiResponse(true, HttpStatus.CREATED, 'List created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get lists by board ID' })
  async findAllByBoardId(
    @Query('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.listsService.findAllByBoardId(boardId, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'Lists fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get list by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.listsService.findOne(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'List fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a list' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.listsService.update(id, dto, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'List updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a list' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.listsService.remove(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'List deleted successfully');
  }
}
