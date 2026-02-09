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
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { LabelsService } from './labels.service';
import { CreateLabelDto, UpdateLabelDto } from './dto/label.dto';

@Controller('labels')
@ApiTags('Labels')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all labels for the current organization' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string;
    if (!orgId) {
      return new ApiResponse(false, HttpStatus.BAD_REQUEST, 'X-Organization-Id header required', null);
    }
    const response = await this.labelsService.findAll(orgId, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Labels fetched successfully', response);
  }

  @Post()
  @ApiOperation({ summary: 'Create a label' })
  async create(@Body() dto: CreateLabelDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers['x-organization-id'] as string;
    if (!orgId) {
      return new ApiResponse(false, HttpStatus.BAD_REQUEST, 'X-Organization-Id header required', null);
    }
    const response = await this.labelsService.create(orgId, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.CREATED, 'Label created successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a label' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLabelDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.labelsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Label updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a label' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.labelsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Label deleted successfully');
  }
}
