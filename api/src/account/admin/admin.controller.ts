import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { Event, RecurringEvent, Silhouette, User } from '@prisma/client';
import { AdminService } from './admin.service';

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
  constructor(private readonly adminService: AdminService) {}
  /**
   * 관리자 대시보드 정보 조회
   * - 전체 사용자 수
   * - 오늘 가입자 수
   * - 활성 사용자 수
   * - 신고 대기 건수
   */
  //@Get('dashboard')
  //async getDashboard(@Request() req: { user: User }) {
  //  return await this.adminService.getDashboard();
  //}

  /**
   * 전체 사용자 목록 조회
   * - 페이지네이션 지원
   * - 검색 기능 (이메일, 닉네임)
   * - 정렬 기능
   */
  @Get('users')
  async getAllUsers(): Promise<User[]> {
    return await this.adminService.getAllUsers();
  }

  /**
   * soft delete된 사용자만 전체 조회
   * - 사용자 기본 정보
   */
  @Get('deleted-users')
  async getDeletedUsers(): Promise<User[]> {
    return await this.adminService.getDeletedUsers();
  }

  /**
   * soft delete된 event만 전체 조회
   * - 이벤트 기본 정보
   */
  @Get('deleted-events')
  async getDeletedEvents(): Promise<Event[]> {
    return await this.adminService.getDeletedEvents();
  }

  /**
   * soft delete된 recurringEvent만 전체 조회
   * - 이벤트 기본 정보
   */
  @Get('deleted-recurring-events')
  async getDeletedRecurringEvents(): Promise<RecurringEvent[]> {
    return await this.adminService.getDeletedRecurringEvents();
  }

  /**
   * soft delete된 silhouette만 전체 조회
   * - 실루엣 기본 정보
   */
  @Get('deleted-silhouettes')
  async getDeletedSilhouettes(): Promise<Silhouette[]> {
    return await this.adminService.getDeletedSilhouettes();
  }
}
