import { Injectable } from '@nestjs/common';
import { Notice, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateNoticeDto, NoticeQueryDto } from './notice.dto';

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

  // 특정 사용자의 알림을 페이징 처리하여 조회
  async getNoticesByProfileId(
    profileId: number,
    queryDto: NoticeQueryDto,
  ): Promise<Notice[]> {
    const { offset = 0, limit = 20 } = queryDto;

    return await this.prisma.notice.findMany({
      where: {
        profileId,
        deletedAt: null, // 삭제되지 않은 알림만 조회
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }, // 최신 알림부터 조회
    });
  }

  // 특정 사용자의 총 알림 개수 조회
  async getTotalNoticeCount(profileId: number): Promise<number> {
    return await this.prisma.notice.count({
      where: {
        profileId,
        deletedAt: null,
      },
    });
  }

  async getUnreadCount(profileId: number): Promise<number> {
    return await this.prisma.notice.count({
      where: {
        profileId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  // ------ UPDATE ------
  async markAsRead(noticeId: number): Promise<boolean> {
    await this.prisma.notice.update({
      where: { id: noticeId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return true;
  }

  // 모든 알림을 읽음으로 표시
  async markAllAsRead(profileId: number): Promise<{ count: number }> {
    const result = await this.prisma.notice.updateMany({
      where: {
        profileId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  // ------ DELETE ------
  // 알림 삭제 (Soft Delete)
  async deleteNotice(noticeId: number): Promise<boolean> {
    const result = await this.prisma.notice.update({
      where: { id: noticeId },
      data: { deletedAt: new Date() },
    });

    return !!result;
  }

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
