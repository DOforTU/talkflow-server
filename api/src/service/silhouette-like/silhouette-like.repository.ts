import { Injectable } from '@nestjs/common';
import { SilhouetteLike } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class SilhouetteLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----- CREATE -----

  async createLike(
    profileId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    return await this.prisma.silhouetteLike.create({
      data: { profileId, silhouetteId },
    });
  }

  // ----- UPDATE -----

  async restoreLike(
    profileId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    return await this.prisma.silhouetteLike.update({
      where: {
        profileId_silhouetteId: {
          // 복합키 이름 (스키마에서 @@unique로 지정한 이름) 프리즈마 문법같음
          profileId,
          silhouetteId,
        },
      },
      data: { deletedAt: null },
    });
  }

  // ----- DELETE -----

  async removeLike(
    profileId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    return await this.prisma.silhouetteLike.update({
      where: {
        profileId_silhouetteId: {
          // 복합키 이름 (스키마에서 @@unique로 지정한 이름)
          profileId,
          silhouetteId,
        },
      },
      data: { deletedAt: new Date() },
    });
  }

  // ----- SUB FUNCTION -----

  async isExistingLike(
    profileId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike | null> {
    return await this.prisma.silhouetteLike.findFirst({
      where: { profileId, silhouetteId },
    });
  }
}
