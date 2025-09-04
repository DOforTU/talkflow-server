import { Injectable } from '@nestjs/common';
import { Notice, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateNoticeDto, NoticeQueryDto } from './notice.dto';

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----- CREATE -----

  async createNotice(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    return await this.prisma.notice.create({
      data: createNoticeDto,
    });
  }

  // 트랜잭션용 알림 생성
  async createNoticeWithTransaction(
    createNoticeDto: CreateNoticeDto,
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ): Promise<Notice> {
    return await tx.notice.create({
      data: createNoticeDto,
    });
  }

  // 팔로우와 함께 알림 생성 (트랜잭션)
  async createFollowWithNotice(
    followerId: number,
    followingId: number,
    actorNickname: string,
  ): Promise<{ follow: any; notice: Notice }> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. 팔로우 생성
      const follow = await tx.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // 2. 알림 생성
      const notice = await tx.notice.create({
        data: {
          type: 'FOLLOW',
          title: '새로운 팔로워',
          content: `${actorNickname}님이 회원님을 팔로우하기 시작했습니다.`,
          targetId: followingId,
          actorId: followerId,
          relatedFollowId: follow.id,
        },
      });

      return { follow, notice };
    });
  }

  // 라이크와 함께 알림 생성 (트랜잭션)
  async createLikeWithNotice(
    silhouetteId: number,
    profileId: number,
    silhouetteOwnerId: number,
    actorNickname: string,
  ): Promise<{ like: any; notice: Notice | null }> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. 라이크 생성
      const like = await tx.silhouetteLike.create({
        data: {
          silhouetteId,
          profileId,
        },
      });

      // 2. 알림 생성 (자신의 게시물에 좋아요를 눌렀을 때는 알림 생성하지 않음)
      let notice: Notice | null = null;
      if (profileId !== silhouetteOwnerId) {
        notice = await tx.notice.create({
          data: {
            type: 'LIKE',
            title: '새로운 좋아요',
            content: `${actorNickname}님이 회원님의 실루엣을 좋아합니다.`,
            targetId: silhouetteOwnerId,
            actorId: profileId,
            relatedLikeId: like.id,
          },
        });
      }

      return { like, notice };
    });
  }

  // ----- READ -----

  async getNoticesByTargetId(
    targetId: number,
    queryDto: NoticeQueryDto,
  ): Promise<Notice[]> {
    const { isRead, type, limit = 20, offset = 0 } = queryDto;

    return await this.prisma.notice.findMany({
      where: {
        targetId,
        ...(isRead !== undefined && { isRead }),
        ...(type && { type }),
        deletedAt: null,
      },
      include: {
        actor: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        relatedFollow: {
          include: {
            follower: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
        relatedLike: {
          include: {
            profile: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
            silhouette: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getUnreadCount(targetId: number): Promise<number> {
    return await this.prisma.notice.count({
      where: {
        targetId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  // ----- UPDATE -----

  async markAsRead(noticeId: number): Promise<Notice> {
    return await this.prisma.notice.update({
      where: { id: noticeId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(targetId: number): Promise<{ count: number }> {
    const result = await this.prisma.notice.updateMany({
      where: {
        targetId,
        isRead: false,
        deletedAt: null,
      },
      data: { isRead: true },
    });
    
    return { count: result.count };
  }

  // ----- DELETE -----

  async deleteNotice(noticeId: number): Promise<boolean> {
    const result = await this.prisma.notice.update({
      where: { id: noticeId },
      data: { deletedAt: new Date() },
    });
    
    return !!result;
  }
}
