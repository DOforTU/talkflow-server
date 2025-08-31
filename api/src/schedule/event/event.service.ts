import { EventRepository } from './event.repository';
import { Injectable } from '@nestjs/common';
import { CreateEventDto, EventData } from './event.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LocationService } from '../location/location.service';
import { RecurringEventService } from '../recurring-event/recurring-event.service';
import { RRule } from 'rrule';
import { Event, Prisma } from '@prisma/client';
import { RecurringData } from '../recurring-event/recurring-event.dto';

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly locationService: LocationService,
    private readonly recurringEventService: RecurringEventService,
    private readonly eventRepository: EventRepository,
  ) {}

  // ===== CREATE =====

  /**
   * 1. dto에 위치 정보가 있다면 location 탐색 후 locationId를 반환받음
   * 2. 반복 일정 생성(controller에서 recurring은 이미 존재하는 것을 보장)
   * 2-1. recurringEvent 인스턴스 생성
   * 2-2. recurringEvent의 start~end에 따라 여러 event를 생성
   * @param userId
   * @param createEventDto
   * @returns
   */
  async createEvents(
    userId: number,
    createEventDto: CreateEventDto,
  ): Promise<Event[]> {
    const { recurring, location, ...eventData } = createEventDto;
    // 위치 생성(location이 undefined라면 반환값도 undefined)
    const locationId =
      await this.locationService.createLocationIfNeeded(location);

    return await this.prismaService.$transaction(async (tx) => {
      // 반복 일정 생성
      return this.createRecurringEvent(
        tx,
        userId,
        eventData,
        recurring!, // controller에서 recurring은 이미 존재하는 것을 보장
        locationId,
      );
    });
  }

  /**
   * 단일 이벤트 생성
   * 1. dto에 위치 정보가 있다면 location 탐색 후 locationId를 반환받음
   * 2. 이벤트 생성
   * @param userId
   * @param createEventDto
   * @returns
   */
  async createSingleEvent(
    userId: number,
    createEventDto: CreateEventDto,
  ): Promise<Event> {
    const { location, ...eventData } = createEventDto;

    // 위치 생성(location이 undefined라면 반환값도 undefined)
    const locationId =
      await this.locationService.createLocationIfNeeded(location);

    return this.eventRepository.createSingleEvent(
      userId,
      eventData,
      locationId,
    );
  }

  // ===== Sub Functions =====

  /**
   * 반복 일정과 이벤트 생성
   * 1. recurringEvent 생성
   * 2. recurringEvent의 시간에 맞게 여러 개의 이벤트 생성
   * @param tx
   * @param userId
   * @param eventData
   * @param recurring
   * @param locationId
   * @returns
   */
  private async createRecurringEvent(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
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

    // recurring 범위에 따라 실제 이벤트들 생성
    const events = await this.createEventsByRecurring(
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
   * 이벤트 인스턴스들 생성
   */
  private async createEventsByRecurring(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    eventData: EventData,
    recurring: RecurringData,
    recurringEventId: number,
    locationId?: number,
  ): Promise<Event[]> {
    const startDate = new Date(recurring.startDate);
    const endDate = recurring.endDate ? new Date(recurring.endDate) : undefined;
    const originalStart = new Date(eventData.startTime);
    const originalEnd = new Date(eventData.endTime);

    // 반복 날짜들 생성
    const recurringDates: Date[] = this.generateRecurringDates(
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

      const event: Event = await this.eventRepository.createEventByTransaction(
        tx,
        userId,
        recurringEventId,
        eventData,
        newStart,
        newEnd,
        locationId,
      );

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
    endDate?: Date,
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
   * 시간은 동일해도 날짜가 다를 수 있기에 필요
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
