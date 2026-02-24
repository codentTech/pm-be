import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OrgRole } from 'src/common/types/org-role.enum';

export class CreateInvitationDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email to invite' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  Email: string;

  @ApiProperty({ enum: OrgRole, default: OrgRole.DEVELOPER })
  @IsEnum(OrgRole)
  @IsNotEmpty()
  Role: OrgRole;
}
