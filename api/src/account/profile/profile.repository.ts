import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNickname(nickname: string) {
    return await this.prisma.profile.findUnique({
      where: { nickname },
    });
  }
}
