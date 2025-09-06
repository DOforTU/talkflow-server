import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { User } from '@prisma/client';

/**
 * AdminController
 * ---------------
 * 관리자 전용 API 엔드포인트를 제공합니다.
 *
 * 주요 기능:
 * - 사용자 관리 (조회, 차단, 해제)
 * - 시스템 통계 조회
 * - 신고 관리
 * - 시스템 알림 발송
 *
 * 보안:
 * - AdminGuard를 통해 관리자만 접근 가능
 * - 모든 액션은 관리자 권한 필요
 */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  /**
   * 관리자 대시보드 정보 조회
   * - 전체 사용자 수
   * - 오늘 가입자 수
   * - 활성 사용자 수
   * - 신고 대기 건수
   */
  @Get('dashboard')
  async getDashboard(@Request() req: { user: User }) {
    return {
      message: '관리자 대시보드',
      admin: req.user.email,
      stats: {
        totalUsers: 1250,
        todaySignups: 12,
        activeUsers: 890,
        pendingReports: 5,
      },
    };
  }

  /**
   * 전체 사용자 목록 조회
   * - 페이지네이션 지원
   * - 검색 기능 (이메일, 닉네임)
   * - 정렬 기능
   */
  @Get('users')
  async getAllUsers(@Request() req: { user: User }) {
    return {
      message: '전체 사용자 목록',
      admin: req.user.email,
      users: [
        {
          id: 1,
          email: 'user1@example.com',
          nickname: '사용자1',
          status: 'active',
        },
        {
          id: 2,
          email: 'user2@example.com',
          nickname: '사용자2',
          status: 'active',
        },
        {
          id: 3,
          email: 'user3@example.com',
          nickname: '사용자3',
          status: 'blocked',
        },
      ],
    };
  }

  /**
   * 특정 사용자 상세 정보 조회
   * - 사용자 기본 정보
   * - 활동 통계
   * - 신고 이력
   */
  @Get('users/:id')
  async getUserDetail(
    @Request() req: { user: User },
    @Param('id') userId: string,
  ) {
    return {
      message: `사용자 ${userId} 상세 정보`,
      admin: req.user.email,
      user: {
        id: userId,
        email: 'user@example.com',
        nickname: '사용자',
        createdAt: new Date(),
        posts: 25,
        followers: 100,
        reports: [],
      },
    };
  }

  /**
   * 사용자 계정 차단
   * - 로그인 차단
   * - 활동 제한
   * - 차단 사유 기록
   */
  @Post('users/:id/block')
  async blockUser(
    @Request() req: { user: User },
    @Param('id') userId: string,
    @Body() blockData: { reason: string },
  ) {
    return {
      message: `사용자 ${userId} 차단 완료`,
      admin: req.user.email,
      action: 'block',
      reason: blockData.reason,
      timestamp: new Date(),
    };
  }

  /**
   * 사용자 계정 차단 해제
   * - 로그인 허용
   * - 활동 제한 해제
   */
  @Post('users/:id/unblock')
  async unblockUser(
    @Request() req: { user: User },
    @Param('id') userId: string,
  ) {
    return {
      message: `사용자 ${userId} 차단 해제 완료`,
      admin: req.user.email,
      action: 'unblock',
      timestamp: new Date(),
    };
  }

  /**
   * 신고 목록 조회
   * - 대기, 처리완료, 거절 상태별 조회
   * - 신고 타입별 필터링
   */
  @Get('reports')
  async getReports(@Request() req: { user: User }) {
    return {
      message: '신고 목록',
      admin: req.user.email,
      reports: [
        {
          id: 1,
          type: '부적절한 콘텐츠',
          targetUser: '신고당한사용자',
          reporter: '신고자',
          status: 'pending',
          createdAt: new Date(),
        },
      ],
    };
  }

  /**
   * 신고 처리
   * - 승인: 해당 사용자 제재
   * - 거절: 신고 기각
   */
  @Patch('reports/:id')
  async handleReport(
    @Request() req: { user: User },
    @Param('id') reportId: string,
    @Body() action: { status: 'approved' | 'rejected'; note?: string },
  ) {
    return {
      message: `신고 ${reportId} 처리 완료`,
      admin: req.user.email,
      reportId,
      action: action.status,
      note: action.note,
      timestamp: new Date(),
    };
  }

  // 이 부분 notice자체에서 구현되어있어서 여기서 굳이 구현해야하는건가?

  //  /**
  //   * 시스템 알림 발송
  //   * - 전체 사용자 대상
  //   * - 특정 사용자 대상
  //   * - 공지사항, 업데이트 안내 등
  //   */
  //  @Post('notifications')
  //  async sendSystemNotification(
  //    @Request() req: { user: User },
  //    @Body()
  //    notification: {
  //      title: string;
  //      content: string;
  //      targetType: 'all' | 'specific';
  //      targetUsers?: number[];
  //    },
  //  ) {
  //    return {
  //      message: '시스템 알림 발송 완료',
  //      admin: req.user.email,
  //      notification: {
  //        title: notification.title,
  //        content: notification.content,
  //        targetType: notification.targetType,
  //        sentCount:
  //          notification.targetType === 'all'
  //            ? 1250
  //            : notification.targetUsers?.length || 0,
  //      },
  //      timestamp: new Date(),
  //    };
  //  }

  //  /**
  //   * 시스템 통계 조회
  //   * - 일간/주간/월간 통계
  //   * - 사용자 활동 지표
  //   * - 콘텐츠 생성 통계
  //   */
  //  @Get('statistics')
  //  async getStatistics(@Request() req: { user: User }) {
  //    return {
  //      message: '시스템 통계',
  //      admin: req.user.email,
  //      statistics: {
  //        daily: {
  //          signups: 12,
  //          posts: 89,
  //          activeUsers: 450,
  //        },
  //        weekly: {
  //          signups: 78,
  //          posts: 634,
  //          activeUsers: 892,
  //        },
  //        monthly: {
  //          signups: 324,
  //          posts: 2156,
  //          activeUsers: 1180,
  //        },
  //      },
  //    };
  //  }
}
