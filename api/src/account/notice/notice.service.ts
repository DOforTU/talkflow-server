import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoticeDto, NoticeQueryDto } from './notice.dto';
import {
  Notice,
  notice_type_enum,
  Follow,
  SilhouetteLike,
  Prisma,
} from '@prisma/client';
import { NoticeRepository } from './notice.repository';

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  // ===== 트랜잭션 메서드들 =====

  /**
   * 팔로우와 함께 알림 생성 (트랜잭션)
   * 팔로우 액션이 실행되면 동시에 알림도 생성됩니다.
   *
   * @param followerId - 팔로우를 하는 사람의 ID
   * @param followingId - 팔로우를 받는 사람의 ID
   * @param actorNickname - 팔로우를 하는 사람의 닉네임
   */
  async createFollowWithNotice(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    followerId: number,
    followingId: number,
    actorNickname: string,
  ): Promise<{ follow: Follow; notice: Notice }> {
    return await this.noticeRepository.createFollowWithNotice(
      tx,
      followerId,
      followingId,
      actorNickname,
    );
  }

  /**
   * 좋아요와 함께 알림 생성 (트랜잭션)
   * 좋아요 액션이 실행되면 동시에 알림도 생성됩니다.
   * 단, 자신의 게시물에 좋아요를 눌렀을 때는 알림이 생성되지 않습니다.
   *
   * @param silhouetteId - 좋아요를 받는 실루엣 ID
   * @param profileId - 좋아요를 누르는 사람의 프로필 ID
   * @param silhouetteOwnerId - 실루엣 소유자의 프로필 ID
   * @param actorNickname - 좋아요를 누르는 사람의 닉네임
   */
  async createLikeWithNotice(
    silhouetteId: number,
    profileId: number,
    silhouetteOwnerId: number,
    actorNickname: string,
  ): Promise<{ like: SilhouetteLike; notice: Notice | null }> {
    return await this.noticeRepository.createLikeWithNotice(
      silhouetteId,
      profileId,
      silhouetteOwnerId,
      actorNickname,
    );
  }

  // ===== 일반 알림 메서드들 =====

  /**
   * 단순 알림 생성
   * 직접적으로 알림만 생성할 때 사용합니다.
   */
  async createNotice(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    return await this.noticeRepository.createNotice(createNoticeDto);
  }

  /**
   * 시스템 알림 생성 (관리자 공지, 업데이트 알림 등)
   */
  async createSystemNotice(
    targetId: number,
    title: string,
    content: string,
  ): Promise<Notice> {
    const createNoticeDto: CreateNoticeDto = {
      type: notice_type_enum.SYSTEM,
      title,
      content,
      targetId,
      // 시스템 알림은 actorId가 없음
    };

    return await this.noticeRepository.createNotice(createNoticeDto);
  }

  // ===== 조회 메서드들 =====

  /**
   * 사용자의 알림 목록 조회 (페이지네이션 지원)
   */
  async getUserNotices(
    targetId: number,
    queryDto: NoticeQueryDto,
  ): Promise<Notice[]> {
    return await this.noticeRepository.getNoticesByTargetId(targetId, queryDto);
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(targetId: number): Promise<{ count: number }> {
    const count = await this.noticeRepository.getUnreadCount(targetId);
    return { count };
  }

  // ===== 업데이트 메서드들 =====

  /**
   * 특정 알림을 읽음으로 표시
   */
  async markAsRead(noticeId: number): Promise<Notice> {
    return await this.noticeRepository.markAsRead(noticeId);
  }

  /**
   * 모든 알림을 읽음으로 표시
   */
  async markAllAsRead(targetId: number): Promise<{ count: number }> {
    return await this.noticeRepository.markAllAsRead(targetId);
  }

  // ===== 삭제 메서드들 =====

  /**
   * 알림 삭제 (Soft Delete)
   */
  async deleteNotice(noticeId: number): Promise<boolean> {
    return await this.noticeRepository.deleteNotice(noticeId);
  }
}
