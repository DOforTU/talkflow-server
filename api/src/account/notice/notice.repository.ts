import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateNoticeDto } from './notice.dto';

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== CREATE =====
  async create(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    dto: CreateNoticeDto,
  ) {
    return await tx.notice.create({
      data: dto,
    });
  }

  // 좋아요와 함께 알림 생성하는 트랜잭션 메서드
  async createLikeWithNotice(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    dto: CreateNoticeDto,
  ) {
    return await tx.notice.create({
      data: dto,
    });
  }

  // ===== READ =====

  // 오래된 알림 정리 메서드
  async cleanupOldNotices(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notice.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return result.count;
  }
}
