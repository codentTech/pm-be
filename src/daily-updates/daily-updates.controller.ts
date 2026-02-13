import {
  Body,
  ClassSerializerInterceptor,
  Controller,
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
import { DailyUpdatesService } from './daily-updates.service';
import { CreateDailyUpdateDto, UpdateDailyUpdateDto } from './dto/daily-update.dto';
import { DailyUpdateQueryDto } from './dto/daily-update-query.dto';
import { DailyUpdateBacklogQueryDto } from './dto/daily-update-backlog-query.dto';

@Controller('daily-updates')
@ApiTags('Daily Updates')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class DailyUpdatesController {
  constructor(private readonly dailyUpdatesService: DailyUpdatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create daily update' })
  async create(@Body() dto: CreateDailyUpdateDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.dailyUpdatesService.create(
      dto,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(
      true,
      HttpStatus.CREATED,
      'Daily update created',
      response,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get daily updates (paginated)' })
  async findAll(@Query() query: DailyUpdateQueryDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.dailyUpdatesService.findAll(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
      {
        date: query.date,
        from: query.from,
        to: query.to,
        userId: query.userId,
        role: query.role,
        status: query.status,
        search: query.search,
      },
    );
    return new ApiResponse(
      true,
      HttpStatus.OK,
      'Daily updates fetched',
      response,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily update by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.dailyUpdatesService.findOne(
      id,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Daily update fetched', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update daily update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyUpdateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.dailyUpdatesService.update(
      id,
      dto,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Daily update updated', response);
  }

  @Get('backlogs/missing')
  @ApiOperation({ summary: 'Missing update backlog' })
  async missingBacklog(
    @Query() query: DailyUpdateBacklogQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.dailyUpdatesService.getMissingUpdateBacklog(
      req.user as UserEntity,
      orgId,
      query.date ?? new Date().toISOString().slice(0, 10),
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Missing backlog fetched', response);
  }

  @Get('backlogs/blockers')
  @ApiOperation({ summary: 'Blocker backlog' })
  async blockerBacklog(
    @Query() query: DailyUpdateBacklogQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const from = query.from ?? query.date ?? new Date().toISOString().slice(0, 10);
    const to = query.to ?? query.date ?? new Date().toISOString().slice(0, 10);
    const response = await this.dailyUpdatesService.getBlockerBacklog(
      req.user as UserEntity,
      orgId,
      from,
      to,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Blocker backlog fetched', response);
  }

  @Get('backlogs/off-plan')
  @ApiOperation({ summary: 'Off-plan backlog' })
  async offPlanBacklog(
    @Query() query: DailyUpdateBacklogQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const from = query.from ?? query.date ?? new Date().toISOString().slice(0, 10);
    const to = query.to ?? query.date ?? new Date().toISOString().slice(0, 10);
    const response = await this.dailyUpdatesService.getOffPlanBacklog(
      req.user as UserEntity,
      orgId,
      from,
      to,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Off-plan backlog fetched', response);
  }
}
