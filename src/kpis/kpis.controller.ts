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
import { KpisService } from './kpis.service';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';

@Controller('kpis')
@ApiTags('KPIs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Post()
  @ApiOperation({ summary: 'Create a KPI' })
  async create(@Body() dto: CreateKpiDto, @Req() req: AuthenticatedRequest) {
    const response = await this.kpisService.create(dto, req.user);
    return new ApiResponse(true, HttpStatus.CREATED, 'KPI created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all KPIs for the current user' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const response = await this.kpisService.findAll(req.user);
    return new ApiResponse(true, HttpStatus.OK, 'KPIs fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get KPI by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.kpisService.findOne(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'KPI fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a KPI' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKpiDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.kpisService.update(id, dto, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'KPI updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a KPI' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.kpisService.remove(id, req.user);
    return new ApiResponse(true, HttpStatus.OK, 'KPI deleted successfully');
  }
}
