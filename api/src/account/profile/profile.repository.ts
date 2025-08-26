import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNickname(nickname: string): Promise<Profile | null> {
    return await this.prisma.profile.findFirst({
      where: { nickname, deletedAt: null },
    });
  }
}
