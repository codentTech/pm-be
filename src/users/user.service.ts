import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/common/repositories/user.repository";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAllUsers() {
    return this.userRepository.getORMMethods().find();
  }
}
