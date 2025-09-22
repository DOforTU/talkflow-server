import { Injectable } from '@nestjs/common';
import { User, Event, RecurringEvent, Silhouette } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

/**
 * AdminService
 * ---------------
 * 관리자 전용 데이터 관리 서비스
 *
 * 주요 기능:
 * - 전체 데이터 조회 (일반 + soft delete 포함)
 * - soft delete된 데이터만 조회
 * - soft delete → hard delete 변환
 *
 * 보안:
 * - AdminGuard를 통해 관리자만 접근 가능
 * - 중요한 데이터 삭제는 신중하게 처리
 */
@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== 사용자 관리 =====

  /**
   * 전체 사용자 조회 (일반 + soft delete 포함)
   */
  async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      include: {
        profile: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            createdAt: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * soft delete된 이벤트만 조회
   */
  async getDeletedUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        profile: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            createdAt: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * 사용자 soft delete → hard delete
   */
  async hardDeleteUser(
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. 관련 데이터들 hard delete
        await tx.profile.deleteMany({ where: { userId } });
        await tx.silhouette.deleteMany({ where: { profile: { userId } } });
        await tx.event.deleteMany({ where: { userId } });
        await tx.recurringEvent.deleteMany({ where: { userId } });
        await tx.notice.deleteMany({ where: { profile: { userId } } });
        await tx.follow.deleteMany({
          where: {
            OR: [{ follower: { userId } }, { following: { userId } }],
          },
        });

        // 2. 사용자 hard delete
        await tx.user.delete({ where: { id: userId } });
      });

      return {
        success: true,
        message: `사용자 ID ${userId}가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 삭제 실패: ${error.message}`,
      };
    }
  }

  // ===== 이벤트 관리 =====

  /**
   * soft delete된 이벤트만 조회
   */
  async getDeletedEvents(): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * 이벤트 soft delete → hard delete
   */
  async hardDeleteEvent(
    eventId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.event.delete({
        where: { id: eventId },
      });

      return {
        success: true,
        message: `이벤트 ID ${eventId}가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `이벤트 삭제 실패: ${error.message}`,
      };
    }
  }

  /**
   * 여러 이벤트 일괄 hard delete
   */
  async bulkHardDeleteEvents(
    eventIds: number[],
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      const result = await this.prisma.event.deleteMany({
        where: {
          id: { in: eventIds },
          deletedAt: { not: null }, // soft delete된 것만
        },
      });

      return {
        success: true,
        deletedCount: result.count,
        message: `${result.count}개의 이벤트가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `이벤트 일괄 삭제 실패: ${error.message}`,
      };
    }
  }

  // ===== 반복 이벤트 관리 =====

  /**
   * soft delete된 반복 이벤트만 조회
   */
  async getDeletedRecurringEvents(): Promise<RecurringEvent[]> {
    return await this.prisma.recurringEvent.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * 반복 이벤트 soft delete → hard delete
   */
  async hardDeleteRecurringEvent(
    recurringEventId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.recurringEvent.delete({
        where: { id: recurringEventId },
      });

      return {
        success: true,
        message: `반복 이벤트 ID ${recurringEventId}가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `반복 이벤트 삭제 실패: ${error.message}`,
      };
    }
  }

  /**
   * 여러 반복 이벤트 일괄 hard delete
   */
  async bulkHardDeleteRecurringEvents(
    recurringEventIds: number[],
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      const result = await this.prisma.recurringEvent.deleteMany({
        where: {
          id: { in: recurringEventIds },
          deletedAt: { not: null }, // soft delete된 것만
        },
      });

      return {
        success: true,
        deletedCount: result.count,
        message: `${result.count}개의 반복 이벤트가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `반복 이벤트 일괄 삭제 실패: ${error.message}`,
      };
    }
  }

  // ===== 실루엣 관리 =====

  /**
   * soft delete된 실루엣만 조회
   */
  async getDeletedSilhouettes(): Promise<Silhouette[]> {
    return await this.prisma.silhouette.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        profile: {
          select: {
            id: true,
            nickname: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * 실루엣 soft delete → hard delete
   */
  async hardDeleteSilhouette(
    silhouetteId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. 관련 좋아요들 먼저 삭제
        await tx.silhouetteLike.deleteMany({
          where: { silhouetteId },
        });

        // 2. 관련 알림들 삭제
        await tx.notice.deleteMany({
          where: { relatedEntityId: silhouetteId },
        });

        // 3. 실루엣 hard delete
        await tx.silhouette.delete({
          where: { id: silhouetteId },
        });
      });

      return {
        success: true,
        message: `실루엣 ID ${silhouetteId}가 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `실루엣 삭제 실패: ${error.message}`,
      };
    }
  }

  /**
   * 여러 실루엣 일괄 hard delete
   */
  async bulkHardDeleteSilhouettes(
    silhouetteIds: number[],
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      let deletedCount = 0;

      await this.prisma.$transaction(async (tx) => {
        // 1. 관련 좋아요들 먼저 삭제
        await tx.silhouetteLike.deleteMany({
          where: { silhouetteId: { in: silhouetteIds } },
        });

        // 2. 관련 알림들 삭제
        await tx.notice.deleteMany({
          where: { relatedEntityId: { in: silhouetteIds } },
        });

        // 3. 실루엣들 hard delete
        const result = await tx.silhouette.deleteMany({
          where: {
            id: { in: silhouetteIds },
            deletedAt: { not: null }, // soft delete된 것만
          },
        });

        deletedCount = result.count;
      });

      return {
        success: true,
        deletedCount,
        message: `${deletedCount}개의 실루엣이 완전히 삭제되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `실루엣 일괄 삭제 실패: ${error.message}`,
      };
    }
  }

  // ===== 통계 및 정리 기능 =====

  /**
   * soft delete된 데이터 통계 조회
   */
  async getSoftDeleteStats(): Promise<{
    users: number;
    events: number;
    recurringEvents: number;
    silhouettes: number;
    totalSize: number;
  }> {
    const [users, events, recurringEvents, silhouettes] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.event.count({ where: { deletedAt: { not: null } } }),
      this.prisma.recurringEvent.count({ where: { deletedAt: { not: null } } }),
      this.prisma.silhouette.count({ where: { deletedAt: { not: null } } }),
    ]);

    return {
      users,
      events,
      recurringEvents,
      silhouettes,
      totalSize: users + events + recurringEvents + silhouettes,
    };
  }

  /**
   * 30일 이상 지난 soft delete 데이터 자동 정리
   */
  async autoCleanupOldSoftDeletes(): Promise<{
    users: number;
    events: number;
    recurringEvents: number;
    silhouettes: number;
    message: string;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const results = await this.prisma.$transaction(async (tx) => {
        // 30일 이상 지난 soft delete 데이터들 조회
        const oldUsers = await tx.user.findMany({
          where: {
            deletedAt: { not: null, lt: thirtyDaysAgo },
          },
          select: { id: true },
        });

        const oldEvents = await tx.event.findMany({
          where: {
            deletedAt: { not: null, lt: thirtyDaysAgo },
          },
          select: { id: true },
        });

        const oldRecurringEvents = await tx.recurringEvent.findMany({
          where: {
            deletedAt: { not: null, lt: thirtyDaysAgo },
          },
          select: { id: true },
        });

        const oldSilhouettes = await tx.silhouette.findMany({
          where: {
            deletedAt: { not: null, lt: thirtyDaysAgo },
          },
          select: { id: true },
        });

        // Hard delete 실행
        const deletedEvents = await tx.event.deleteMany({
          where: { id: { in: oldEvents.map((e) => e.id) } },
        });

        const deletedRecurringEvents = await tx.recurringEvent.deleteMany({
          where: { id: { in: oldRecurringEvents.map((re) => re.id) } },
        });

        const deletedSilhouettes = await tx.silhouette.deleteMany({
          where: { id: { in: oldSilhouettes.map((s) => s.id) } },
        });

        // 사용자는 마지막에 (외래키 관계 때문에)
        const deletedUsers = await tx.user.deleteMany({
          where: { id: { in: oldUsers.map((u) => u.id) } },
        });

        return {
          users: deletedUsers.count,
          events: deletedEvents.count,
          recurringEvents: deletedRecurringEvents.count,
          silhouettes: deletedSilhouettes.count,
        };
      });

      return {
        ...results,
        message: `30일 이상 지난 soft delete 데이터가 자동 정리되었습니다.`,
      };
    } catch (error) {
      return {
        users: 0,
        events: 0,
        recurringEvents: 0,
        silhouettes: 0,
        message: `자동 정리 실패: ${error.message}`,
      };
    }
  }
}
