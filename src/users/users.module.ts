import { Module } from '@nestjs/common';
import { UserRepository } from 'src/common/repositories/user.repository';
import { UserController } from './users.controller';
import { UserService } from './user.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
