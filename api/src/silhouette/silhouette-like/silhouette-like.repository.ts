import { Injectable } from '@nestjs/common';
import { Silhouette, SilhouetteLike, User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class SilhouetteLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----- CREATE -----

  async createLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    return await this.prisma.silhouetteLike.create({
      data: { userId, silhouetteId },
    });
  }

  // ----- UPDATE -----

  async restoreLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    return this.prisma.silhouetteLike.update({
      where: {
        userId_silhouetteId: {
          // 복합키 이름 (스키마에서 @@unique로 지정한 이름) 프리즈마 문법같음
          userId,
          silhouetteId,
        },
      },
      data: { deletedAt: null },
    });
  }

  // ----- DELETE -----

  async removeLike(userId: number, silhouetteId: number): Promise<boolean> {
    return this.prisma.silhouetteLike
      .update({
        where: {
          userId_silhouetteId: {
            // 복합키 이름 (스키마에서 @@unique로 지정한 이름)
            userId,
            silhouetteId,
          },
        },
        data: { deletedAt: new Date() },
      })
      .then(() => {
        console.log('Like removed successfully');
        return true;
      })
      .catch((err) => {
        console.error('Like remove error:', err);
        return false;
      });
  }

  // ----- SUB FUNCTION -----

  async isExistingLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike | null> {
    return await this.prisma.silhouetteLike.findFirst({
      where: { userId, silhouetteId },
    });
  }
}
