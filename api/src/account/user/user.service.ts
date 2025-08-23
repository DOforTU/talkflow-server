import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ===== READ =====
  async getUserWithProfileById(id: string): Promise<User> {
    const user = await this.findWithProfileById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===== Sub Functions =====

  async findWithProfileById(id: string): Promise<User | null> {
    return await this.userRepository.findWithProfileById(id);
  }
}
