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
import { BadRequestException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';
import { CardBacklogQueryDto } from './dto/card-backlog-query.dto';

@Controller('cards')
@ApiTags('Cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a card' })
  async create(@Body() dto: CreateCardDto, @Req() req: AuthenticatedRequest) {
    const response = await this.cardsService.create(dto, req.user);
    return new ApiResponse(true, HttpStatus.CREATED, 'Card created successfully', response);
  }

  @Get('backlogs/product')
  @ApiOperation({ summary: 'Get product backlog (project-level)' })
  async productBacklog(@Query() query: CardBacklogQueryDto, @Req() req: AuthenticatedRequest) {
    const response = await this.cardsService.getProductBacklog(
      query.projectId,
      req.user,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Product backlog fetched', response);
  }

  @Get('backlogs/sprint')
  @ApiOperation({ summary: 'Get sprint backlog' })
  async sprintBacklog(@Query() query: CardBacklogQueryDto, @Req() req: AuthenticatedRequest) {
    if (!query.sprintId) {
      throw new BadRequestException('sprintId is required');
    }
    const response = await this.cardsService.getSprintBacklog(
      query.projectId,
      query.sprintId,
      req.user,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Sprint backlog fetched', response);
  }

  @Get('backlogs/bugs')
  @ApiOperation({ summary: 'Get bug backlog' })
  async bugBacklog(@Query() query: CardBacklogQueryDto, @Req() req: AuthenticatedRequest) {
    const response = await this.cardsService.getBugBacklog(
      query.projectId,
      req.user,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Bug backlog fetched', response);
  }

  @Get('backlogs/blocked')
  @ApiOperation({ summary: 'Get blocked backlog' })
  async blockedBacklog(@Query() query: CardBacklogQueryDto, @Req() req: AuthenticatedRequest) {
    const response = await this.cardsService.getBlockedBacklog(
      query.projectId,
      req.user,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Blocked backlog fetched', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.cardsService.findOne(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'Card fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a card (or move to another list)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.cardsService.update(id, dto, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'Card updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a card' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.cardsService.remove(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'Card deleted successfully');
  }
}
