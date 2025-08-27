import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateProfileDto } from './profile.dto';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== READ =====

  async findById(id: number): Promise<Profile | null> {
    return await this.prisma.profile.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByNickname(nickname: string): Promise<Profile | null> {
    return await this.prisma.profile.findFirst({
      where: { nickname, deletedAt: null },
    });
  }

  // ==== UPDATE ====
  async update(id: number, dto: UpdateProfileDto): Promise<Profile> {
    return await this.prisma.profile.update({
      where: { id, deletedAt: null },
      data: dto,
    });
  }
}
