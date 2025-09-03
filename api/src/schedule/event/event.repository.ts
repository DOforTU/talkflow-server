import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Event, Prisma } from '@prisma/client';
import { EventData, ResponseEventDto } from './event.dto';

@Injectable()
export class EventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ===== CREATE =====

  async createSingleEvent(
    userId: number,
    eventData: EventData,
    locationId?: number,
  ): Promise<Event> {
    return await this.prismaService.event.create({
      data: {
        ...eventData,
        startTime: eventData.startTime, // 이미 문자열 형태
        endTime: eventData.endTime, // 이미 문자열 형태
        isAllDay: eventData.isAllDay,
        userId,
        locationId,
      },
    });
  }

  async createEventByTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    recurringEventId: number,
    eventData: EventData,
    newStart: string, // 문자열로 변경
    newEnd: string, // 문자열로 변경
    locationId?: number,
  ): Promise<Event> {
    return await tx.event.create({
      data: {
        ...eventData,
        startTime: newStart, // 이미 문자열 형태
        endTime: newEnd, // 이미 문자열 형태
        isAllDay: eventData.isAllDay,
        userId,
        locationId,
        recurringEventId,
      },
    });
  }

  // ===== READ =====

  async findEventsByUserId(userId: number): Promise<ResponseEventDto[]> {
    return await this.prismaService.event.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isAllDay: true,
        colorCode: true,
        version: true,

        // time columns
        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        // parts of relations
        userId: true,
        recurringEventId: true,
        location: {
          select: {
            id: true,
            nameKo: true,
            nameEn: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
  }

  async findById(eventId: number, userId: number): Promise<Event | null> {
    return await this.prismaService.event.findFirst({
      where: {
        id: eventId,
        userId: userId,
        deletedAt: null,
      },
    });
  }

  // ===== DELETE =====

  async deleteSingleEvent(userId: number, eventId: number): Promise<Event> {
    // Soft delete a single event (verify ownership)
    return await this.prismaService.event.update({
      where: {
        id: eventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteRecurringEvents(
    userId: number,
    recurringEventId: number,
  ): Promise<void> {
    await this.prismaService.event.updateMany({
      where: {
        recurringEventId: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prismaService.recurringEvent.updateMany({
      where: {
        id: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteEventsFromThis(
    userId: number,
    recurringEventId: number,
    fromStartTime: string,
  ): Promise<void> {
    // 해당 날짜 이후의 이벤트들을 삭제
    await this.prismaService.event.updateMany({
      where: {
        recurringEventId: recurringEventId,
        userId: userId,
        startTime: {
          gte: fromStartTime,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // RecurringEvent의 RRULE을 업데이트하여 선택한 날짜 전까지만 반복하도록 수정
    const recurringEvent = await this.prismaService.recurringEvent.findFirst({
      where: {
        id: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (recurringEvent) {
      // fromStartTime에서 하루 전 날짜를 계산
      const fromDate = new Date(fromStartTime.split(' ')[0]);
      const untilDate = new Date(fromDate);
      untilDate.setDate(untilDate.getDate() - 1);
      
      // RRULE에 UNTIL 추가 (날짜만 사용, 시간대 무관)
      const untilDateStr = untilDate.getFullYear() + 
        String(untilDate.getMonth() + 1).padStart(2, '0') + 
        String(untilDate.getDate()).padStart(2, '0'); // YYYYMMDD 형식
      
      let updatedRule = recurringEvent.rule;
      if (updatedRule.includes('UNTIL=')) {
        // 기존 UNTIL을 새로운 날짜로 교체
        updatedRule = updatedRule.replace(/UNTIL=\d{8}(T\d{6}Z?)?/, `UNTIL=${untilDateStr}`);
      } else {
        // UNTIL 추가 (날짜만, 시간 없음)
        updatedRule += `;UNTIL=${untilDateStr}`;
      }

      // endDate를 선택한 날짜의 전날로 설정
      const endDateStr = untilDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

      await this.prismaService.recurringEvent.update({
        where: {
          id: recurringEventId,
        },
        data: {
          rule: updatedRule,
          endDate: endDateStr,
        },
      });
    }
  }
}
