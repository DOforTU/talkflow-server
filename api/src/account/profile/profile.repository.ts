import { ConflictException, Injectable } from '@nestjs/common';
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
    try {
      // 1. Prisma의 update 메서드를 사용하여 조건부 업데이트
      // where 절에 id와 함께 버전 번호를 포함시켜 충돌 방지
      return await this.prisma.profile.update({
        where: {
          id: id,
          deletedAt: null,
          version: dto.version, // 낙관적 잠금: 클라이언트가 보낸 버전과 일치해야 함
        },
        data: {
          // 2. DTO의 데이터를 전개하고, 버전 번호를 1 증가시킴
          ...dto,
          version: dto.version + 1,
        },
      });
    } catch (e) {
      // 3. Prisma의 P2025 에러(레코드 없음)를 낙관적 잠금 충돌로 간주
      if (e.code === 'P2025') {
        throw new ConflictException(
          'Profile has been updated by another user.',
        );
      }
      throw e;
    }
  }
}
