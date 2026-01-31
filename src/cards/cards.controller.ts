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
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

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
