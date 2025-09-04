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
}
