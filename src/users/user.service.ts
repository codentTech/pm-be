import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from 'src/common/repositories/user.repository';
import { BcryptService } from 'src/common/services/bcrypt.service';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async findAllUsers() {
    return this.userRepository.getORMMethods().find();
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneRecord({ Id: id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (dto.FullName !== undefined) user.FullName = dto.FullName;
    return this.userRepository.getORMMethods().save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    const matched = await this.bcryptService.comparePassword(
      currentPassword,
      user.Password,
    );
    if (!matched) throw new BadRequestException('Current password is incorrect');
    const hashed = await this.bcryptService.hashPassword(newPassword);
    user.Password = hashed;
    await this.userRepository.getORMMethods().save(user);
  }
}
