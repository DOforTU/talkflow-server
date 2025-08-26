import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ===== READ =====
  async getUserById(id: number): Promise<User> {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===== UPDATE =====
  async updateMe(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.getUserById(id);
    return this.userRepository.updateMe(id, updateUserDto);
  }

  // ===== Sub Functions =====

  async findUserById(id: number): Promise<User | null> {
    return await this.userRepository.findById(id);
  }
}
