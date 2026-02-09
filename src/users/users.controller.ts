import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { UserService } from './user.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';

@Controller('user')
@ApiTags('User')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the list of all users' })
  async findAllUsers() {
    const response = await this.userService.findAllUsers();
    return new ApiResponse(true, HttpStatus.OK, 'All users fetched successfully.', response);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = req.user as UserEntity;
    const response = await this.userService.findById(user.Id);
    return new ApiResponse(true, HttpStatus.OK, 'Profile fetched successfully', response);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: AuthenticatedRequest) {
    const user = req.user as UserEntity;
    const response = await this.userService.updateProfile(user.Id, dto);
    return new ApiResponse(true, HttpStatus.OK, 'Profile updated successfully', response);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = req.user as UserEntity;
    await this.userService.changePassword(
      user.Id,
      dto.CurrentPassword,
      dto.NewPassword,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Password changed successfully');
  }
}
