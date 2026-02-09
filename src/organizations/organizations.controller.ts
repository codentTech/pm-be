import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
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
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateMemberRoleDto,
} from './dto/organization.dto';

@Controller('organizations')
@ApiTags('Organizations')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  async create(@Body() dto: CreateOrganizationDto, @Req() req: AuthenticatedRequest) {
    const response = await this.organizationsService.create(dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.CREATED, 'Organization created successfully', response);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for the current user' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const response = await this.organizationsService.findAllForUser(req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Organizations fetched successfully', response);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get or create default organization' })
  async getOrEnsureDefault(@Req() req: AuthenticatedRequest) {
    const response = await this.organizationsService.getOrEnsureDefaultOrg(req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Default organization', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.organizationsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Organization fetched successfully', response);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.organizationsService.getMembers(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Members fetched successfully', response);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.organizationsService.updateMemberRole(
      id,
      memberId,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Member role updated successfully', response);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from organization' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.organizationsService.removeMember(
      id,
      memberId,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Member removed successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.organizationsService.update(id, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Organization updated successfully', response);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.organizationsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Organization deleted successfully');
  }
}
