import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserBySub(sub: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: sub,
      },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }
}
