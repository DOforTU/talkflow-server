import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateUserDto } from './user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async updateMe(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: { ...updateUserDto },
    });
  }
}
