import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ROLE } from 'src/common/types/roles.enum';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  Email: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description: 'The password of the user (must be at least 6 characters)',
    required: true,
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  Password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
    required: true,
  })
  @IsNotEmpty({ message: 'Full name is required' })
  FullName: string;

  @ApiProperty({
    example: ROLE.USER,
    description: 'Role of the user (super_admin, organization_admin, user)',
    enum: ROLE,
    required: true,
  })
  @IsEnum(ROLE, { message: 'Invalid role' })
  @IsNotEmpty({ message: 'Role is required' })
  Role: ROLE;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123token',
    description: 'The verification token from email',
    required: true,
  })
  @IsNotEmpty({ message: 'Token is required' })
  Token: string;
}

export class ForgetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  Email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123token',
    description: 'The password reset token from email',
    required: true,
  })
  @IsNotEmpty({ message: 'Token is required' })
  Token: string;

  @ApiProperty({
    example: 'NewStrongP@ssw0rd!',
    description: 'The new password',
    required: true,
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  NewPassword: string;
}
