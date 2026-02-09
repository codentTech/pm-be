import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  FullName?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Current password is required' })
  CurrentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  NewPassword: string;
}
