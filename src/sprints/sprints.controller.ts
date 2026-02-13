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
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { SprintListQueryDto } from './dto/sprint-query.dto';
import { SprintsService } from './sprints.service';

@Controller('sprints')
@ApiTags('Sprints')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sprint' })
  async create(@Body() dto: CreateSprintDto, @Req() req: AuthenticatedRequest) {
    const response = await this.sprintsService.create(dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.CREATED, 'Sprint created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get sprints (by project)' })
  async findAll(@Query() query: SprintListQueryDto, @Req() req: AuthenticatedRequest) {
    if (!query.projectId) {
      return new ApiResponse(true, HttpStatus.OK, 'Sprints fetched', []);
    }
    const response = await this.sprintsService.findAllByProjectId(
      query.projectId,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Sprints fetched', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sprint by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.sprintsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Sprint fetched successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sprint' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.sprintsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Sprint updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sprint' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.sprintsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Sprint deleted successfully');
  }
}
