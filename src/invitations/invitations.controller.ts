import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { InvitationsService } from 'src/invitations/invitations.service';
import { CreateInvitationDto } from './dto/invitation.dto';

@Controller('invitations')
@ApiTags('Invitations')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('preview/:token')
  @Public()
  @ApiOperation({ summary: 'Get invitation preview (public, no auth required)' })
  async preview(@Param('token') token: string) {
    const response = await this.invitationsService.getPreview(token);
    return new ApiResponse(true, HttpStatus.OK, 'Invitation preview fetched', response);
  }

  @Post('organizations/:orgId')
  @ApiOperation({ summary: 'Invite a user to an organization' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInvitationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.invitationsService.create(orgId, dto, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.CREATED, 'Invitation sent successfully', response);
  }

  @Get('organizations/:orgId')
  @ApiOperation({ summary: 'Get pending invitations for an organization' })
  async findByOrg(@Param('orgId') orgId: string, @Req() req: AuthenticatedRequest) {
    const response = await this.invitationsService.findPendingByOrg(
      orgId,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Invitations fetched successfully', response);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get pending invitations for the current user' })
  async findForMe(@Req() req: AuthenticatedRequest) {
    const response = await this.invitationsService.findPendingForUser(req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Invitations fetched successfully', response);
  }

  @Post('accept/:token')
  @ApiOperation({ summary: 'Accept an invitation' })
  async accept(@Param('token') token: string, @Req() req: AuthenticatedRequest) {
    await this.invitationsService.accept(token, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Invitation accepted successfully');
  }

  @Post('decline/:token')
  @ApiOperation({ summary: 'Decline an invitation' })
  async decline(@Param('token') token: string, @Req() req: AuthenticatedRequest) {
    await this.invitationsService.decline(token, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Invitation declined successfully');
  }

  @Delete('organizations/:orgId/:invitationId')
  @ApiOperation({ summary: 'Cancel an invitation' })
  async cancel(
    @Param('orgId') orgId: string,
    @Param('invitationId') invitationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.invitationsService.cancel(invitationId, orgId, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, 'Invitation cancelled successfully');
  }

  @Post('organizations/:orgId/:invitationId/resend')
  @ApiOperation({ summary: 'Resend an invitation' })
  async resend(
    @Param('orgId') orgId: string,
    @Param('invitationId') invitationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.invitationsService.resend(
      invitationId,
      orgId,
      req.user as UserEntity,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Invitation resent successfully', response);
  }
}
