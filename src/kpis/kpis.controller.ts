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
import { KpisService } from './kpis.service';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';
import { KpiListQueryDto } from './dto/kpi-query.dto';

@Controller('kpis')
@ApiTags('KPIs')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Post()
  @ApiOperation({ summary: 'Create a KPI' })
  async create(@Body() dto: CreateKpiDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.kpisService.create(dto, req.user as UserEntity, orgId);
    return new ApiResponse(true, HttpStatus.CREATED, 'KPI created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all KPIs for the current organization (paginated)' })
  async findAll(@Query() query: KpiListQueryDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.kpisService.findAllPaginated(
      req.user as UserEntity,
      orgId,
      page,
      limit,
      query.sort,
      query.order,
    );
    return new ApiResponse(true, HttpStatus.OK, 'KPIs fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get KPI by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.kpisService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'KPI fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a KPI' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKpiDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.kpisService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'KPI updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a KPI' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.kpisService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'KPI deleted successfully');
  }
}
