import { Module } from '@nestjs/common';
import { BcryptService } from 'src/common/services/bcrypt.service';
import { UserRepository } from 'src/common/repositories/user.repository';
import { UserController } from './users.controller';
import { UserService } from './user.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, BcryptService],
  exports: [UserRepository],
})
export class UserModule {}
