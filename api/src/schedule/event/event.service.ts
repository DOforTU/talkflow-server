/* eslint-disable @typescript-eslint/no-unsafe-return */
import { EventRepository } from './event.repository';
import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './event.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LocationService } from '../location/location.service';
import { RecurringEventService } from '../recurring-event/recurring-event.service';
import { RRule } from 'rrule';
import { Event } from '@prisma/client';

// 이벤트 데이터 타입 정의
interface EventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  colorCode: string;
}

// 반복 규칙 타입 정의
export interface RecurringData {
  rule: string;
  startDate: string;
  endDate?: string | null;
}

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly locationService: LocationService,
    private readonly recurringEventService: RecurringEventService,
    private readonly eventRepository: EventRepository,
  ) {}

  // ===== CREATE =====
  async createEvents(
    userId: number,
    createEventDto: CreateEventDto,
  ): Promise<Event[]> {
    return await this.prismaService.$transaction(async (tx) => {
      const { recurring, location, ...eventData } = createEventDto;

      // 위치 생성
      const locationId = await this.locationService.createLocationIfNeeded(
        tx,
        location,
      );

      // 반복 일정 생성 (controller에서 recurring은 이미 존재하는 것을 보장)
      return this.createRecurringEvent(
        tx,
        userId,
        eventData,
        recurring!, // non-null assertion
        locationId,
      );
    });
  }

  async createSingleEvent(
    userId: number,
    createEventDto: CreateEventDto,
  ): Promise<Event> {
    return await this.prismaService.$transaction(async (tx) => {
      const { location, ...eventData } = createEventDto;

      // 위치 생성
      const locationId = await this.locationService.createLocationIfNeeded(
        tx,
        location,
      );

      return this.createEvent(tx, userId, eventData, locationId);
    });
  }

  // ===== Sub Functions =====

  /**
   * 일반 이벤트 생성
   */
  private async createEvent(
    tx: any,
    userId: number,
    eventData: EventData,
    locationId?: number | null,
  ): Promise<Event> {
    return (await tx.event.create({
      data: {
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        isAllDay: eventData.isAllDay || false,
        userId,
        locationId,
      },
    })) as Event;
  }

  /**
   * 반복 이벤트 생성
   */
  private async createRecurringEvent(
    tx: any,
    userId: number,
    eventData: EventData,
    recurring: RecurringData,
    locationId?: number,
  ): Promise<Event[]> {
    // 반복 일정 메타데이터 생성
    const recurringEvent =
      await this.recurringEventService.createRecurringEventWithTransaction(
        tx,
        userId,
        eventData,
        recurring,
        locationId,
      );
    const recurringEventId: number = recurringEvent.id;

    // 실제 이벤트들 생성
    const events = await this.createRecurringEventInstances(
      tx,
      userId,
      eventData,
      recurring,
      recurringEventId,
      locationId,
    );

    return events;
  }

  /**
   * 반복 이벤트 인스턴스들 생성
   */
  private async createRecurringEventInstances(
    tx: any,
    userId: number,
    eventData: EventData,
    recurring: RecurringData,
    recurringEventId: number,
    locationId?: number,
  ): Promise<Event[]> {
    const startDate = new Date(recurring.startDate);
    const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
    const originalStart = new Date(eventData.startTime);
    const originalEnd = new Date(eventData.endTime);

    // 반복 날짜들 생성
    const recurringDates = this.generateRecurringDates(
      recurring.rule,
      startDate,
      endDate,
    );

    // 각 날짜별 이벤트 생성
    const events: Event[] = [];
    for (const recurringDate of recurringDates) {
      const { newStart, newEnd } = this.calculateEventTimes(
        originalStart,
        originalEnd,
        recurringDate,
      );

      const event = await tx.event.create({
        data: {
          ...eventData,
          startTime: newStart,
          endTime: newEnd,
          isAllDay: eventData.isAllDay || false,
          userId,
          locationId,
          recurringEventId,
        },
      });

      events.push(event);
    }

    return events;
  }

  /**
   * RRULE에서 반복 날짜들을 생성
   * @param rruleString RRULE 문자열
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜 (없으면 6개월 후)
   * @returns 반복 날짜 배열
   */
  private generateRecurringDates(
    rruleString: string,
    startDate: Date,
    endDate: Date | null,
  ): Date[] {
    try {
      // endDate가 없으면 6개월 후까지 생성
      const defaultEndDate =
        endDate || new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

      const rule = RRule.fromString(
        `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nRRULE:${rruleString}`,
      );

      return rule.between(startDate, defaultEndDate, true);
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return [startDate]; // 파싱 실패시 원래 날짜만 반환
    }
  }

  /**
   * 개별 이벤트의 시작/종료 시간 계산
   * @param originalStart 원래 시작 시간
   * @param originalEnd 원래 종료 시간
   * @param newDate 새로운 날짜
   * @returns 새로운 시작/종료 시간
   */
  private calculateEventTimes(
    originalStart: Date,
    originalEnd: Date,
    newDate: Date,
  ) {
    const originalDuration = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(newDate);
    newStart.setHours(
      originalStart.getHours(),
      originalStart.getMinutes(),
      originalStart.getSeconds(),
    );

    const newEnd = new Date(newStart.getTime() + originalDuration);

    return { newStart, newEnd };
  }
}
