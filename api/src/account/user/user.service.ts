import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ===== READ =====
  async getUserById(id: string): Promise<User> {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===== Sub Functions =====
  async findUserBySub(sub: string): Promise<User | null> {
    return await this.userRepository.findUserBySub(sub);
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findUserById(id);
  }
}
