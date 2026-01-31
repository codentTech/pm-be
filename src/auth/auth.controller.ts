import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
@ApiTags('Auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register your account' })
  async register(@Body() body: RegisterDto): Promise<ApiResponse<UserEntity>> {
    const response = await this.authService.register(body);
    return new ApiResponse(true, HttpStatus.CREATED, 'User registered successfully', response);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login into your account' })
  async login(@Body() body: LoginDto) {
    const response = await this.authService.login(body);
    return new ApiResponse(true, HttpStatus.OK, 'User logged in successfully', response);
  }

  
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  googleAuth() {
    return new ApiResponse(true, HttpStatus.OK, 'Redirects to Google login');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google auth callback' })
  async googleAuthRedirect(@Req() req: AuthenticatedRequest) {
    return new ApiResponse(true, HttpStatus.OK, 'Google authentication successful', req.user);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Login with Facebook' })
  facebookAuth() {
    return new ApiResponse(true, HttpStatus.OK, 'Redirects to Facebook login');
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook auth callback' })
  async facebookAuthRedirect(@Req() req: AuthenticatedRequest) {
    return new ApiResponse(true, HttpStatus.OK, 'Facebook authentication successful', req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Login with GitHub' })
  githubAuth() {
    return new ApiResponse(true, HttpStatus.OK, 'Redirects to Github login');
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub auth callback' })
  async githubAuthRedirect(@Req() req: AuthenticatedRequest) {
    return new ApiResponse(true, HttpStatus.OK, 'Github authentication successful', req.user);
  }

  @Get('single-sign-on')
  @UseGuards(AuthGuard('auth0'))
  @ApiOperation({ summary: 'Login with auth0 - single-sign-on' })
  singleSignOn() {
    return new ApiResponse(true, HttpStatus.OK, 'Redirects to auth0 login');
  }

  @Get('single-sign-on/callback')
  @UseGuards(AuthGuard('auth0'))
  @ApiOperation({ summary: 'Auth0 callback' })
  async singleSignOnCallback(@Req() req: AuthenticatedRequest) {
    return new ApiResponse(true, HttpStatus.OK, 'Auth0 authentication successful', req.user);
  }
}
