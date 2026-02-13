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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectListQueryDto } from './dto/project-query.dto';

@Controller('projects')
@ApiTags('Projects')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  async create(@Body() dto: CreateProjectDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.projectsService.create(dto, req.user as UserEntity, orgId);
    return new ApiResponse(true, HttpStatus.CREATED, 'Project created successfully', response);
  }

  @Post('from-bid/:bidId')
  @ApiOperation({ summary: 'Create a project from a won bid' })
  async createFromBid(
    @Param('bidId') bidId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const response = await this.projectsService.createFromBid(
      bidId,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(true, HttpStatus.CREATED, 'Project created from bid', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the current user (paginated)' })
  async findAll(@Query() query: ProjectListQueryDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string | undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.projectsService.findAllPaginated(
      req.user as UserEntity,
      orgId,
      page,
      limit,
      query.sort,
      query.order,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Projects fetched successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID with lists and cards' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.projectsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Project fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.projectsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Project updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.projectsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Project deleted successfully');
  }
}
