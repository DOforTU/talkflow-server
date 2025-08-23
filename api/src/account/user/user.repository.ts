import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWithProfileById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profile: true,
      },
    });
  }
}
