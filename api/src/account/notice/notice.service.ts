import { Injectable } from '@nestjs/common';

import { NoticeRepository } from './notice.repository';
import { CreateNoticeDto } from './notice.dto';
import { notice_type_enum, Prisma } from '@prisma/client';

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  /**
   * 팔로우 요청에 대한 알림 생성
   * 팔로우 로직에 트랜잭션 객체를 넘겨서 사용
   * @param tx
   * @param targetId
   * @param entityId
   * @param entityName
   * @returns
   */
  async createFollowNotice(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >, // 트랜잭션 객체
    targetId: number, // 알림을 받는 사람
    entityId: number, // 알림을 발생시킨 요소의 아이디(나를 팔로우 한 사람)
    entityName: string, // 나를 팔로우 한 사람의 닉네임
  ) {
    const dto: CreateNoticeDto = {
      type: notice_type_enum.follow,
      title: '새로운 팔로워',
      content: `${entityName}님이 당신을 팔로우했습니다.`,
      profileId: targetId,
      relatedEntityId: entityId,
      relatedEntityName: entityName,
    };
    return await this.noticeRepository.create(tx, dto);
  }

  /**
   * 좋아요와 함께 알림 생성 (트랜잭션)
   * 좋아요가 생성될 때 해당 실루엣의 총 좋아요 개수를 확인하고,
   * 10개 이상이면 알림을 생성합니다.
   *
   * @param tx - 트랜잭션 객체
   * @param silhouetteId - 좋아요를 받는 실루엣 ID
   * @param profileId - 좋아요를 누르는 사람의 프로필 ID
   * @param silhouetteOwnerId - 실루엣 소유자의 프로필 ID
   * @returns 좋아요 생성 결과와 알림 생성 여부
   */
  async createLikeWithNotice(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    silhouetteId: number,
    profileId: number,
    silhouetteOwnerId: number,
  ) {
    // 1. 자신의 게시물이 아닌 경우에만 알림 로직 실행
    if (profileId !== silhouetteOwnerId) {
      // 2. 해당 실루엣의 총 좋아요 개수 확인
      const likeCount = await tx.silhouetteLike.count({
        where: {
          silhouetteId,
          deletedAt: null,
        },
      });

      // 3. 10개 이상이면 알림 생성 (10, 20, 30... 배수일 때만)
      if (likeCount >= 10 && likeCount % 10 === 0) {
        const dto: CreateNoticeDto = {
          type: notice_type_enum.like,
          title: '좋아요',
          content: `여러명이 회원님의 게시물에 좋아요를 눌렀습니다.`,
          profileId: silhouetteOwnerId,
        };

        return await this.noticeRepository.create(tx, dto);
      }
    }
  }

  async cleanupOldNotices(): Promise<{ deletedCount: number }> {
    const daysOld: number = 60;
    const deletedCount = await this.noticeRepository.cleanupOldNotices(daysOld);

    return { deletedCount };
  }
}
