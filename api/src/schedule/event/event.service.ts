import { EventRepository } from './event.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto, EventData, EventDetailDto } from './event.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LocationService } from '../location/location.service';
import { RecurringEventService } from '../recurring-event/recurring-event.service';
import { RRule } from 'rrule';
import { Event, Location, Prisma } from '@prisma/client';
import { RecurringData } from '../recurring-event/recurring-event.dto';
import { ResponseLocationDto } from '../location/location.dto';

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

  // ===== READ =====
  async getMyEvents(userId: number): Promise<EventDetailDto[]> {
    return await this.eventRepository.findEventsByUserId(userId);
  }

  async getEventByIdAndUserId(eventId: number, userId: number): Promise<Event> {
    const event = await this.eventRepository.findByIdAndUserId(eventId, userId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  // ===== DELETE =====
  /**
   * 단일 이벤트 삭제
   * @param userId
   * @param eventId
   * @returns
   */
  async deleteSingleEvent(userId: number, eventId: number): Promise<Event> {
    await this.getEventByIdAndUserId(eventId, userId); // 존재 여부 확인
    return await this.eventRepository.deleteSingleEvent(userId, eventId);
  }

  /**
   * 반복 이벤트 삭제 및 관련된 일정 모두 삭제
   * @param userId
   * @param eventId
   * @returns
   */
  async deleteRecurringEvents(userId: number, eventId: number): Promise<void> {
    const event = await this.getEventByIdAndUserId(eventId, userId);
    if (!event.recurringEventId) {
      throw new BadRequestException('Event is not part of a recurring series');
    }
    return await this.eventRepository.deleteRecurringEvents(
      userId,
      event.recurringEventId,
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
    const originalStart = eventData.startTime; // 이미 문자열
    const originalEnd = eventData.endTime; // 이미 문자열

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

      // between 대신 all을 사용하되 UNTIL로 제한하거나, after로 시작일 포함
      if (endDate) {
        // 종료일이 있으면 해당 범위에서 생성 (시작일 포함)
        return rule.all((date, i) => date <= defaultEndDate);
      } else {
        // 종료일이 없으면 최대 100개까지만 생성 (무한 생성 방지)
        return rule.all((date, i) => i < 100 && date <= defaultEndDate);
      }
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return [startDate]; // 파싱 실패시 원래 날짜만 반환
    }
  }

  /**
   * 개별 이벤트의 시작/종료 시간 계산 (문자열 형태)
   * @param originalStart 원래 시작 시간 "2025-09-01 19:30"
   * @param originalEnd 원래 종료 시간 "2025-09-01 21:00"
   * @param newDate 새로운 날짜 (RRULE에서 생성된 Date)
   * @returns 새로운 시작/종료 시간 문자열
   */
  private calculateEventTimes(
    originalStart: string,
    originalEnd: string,
    newDate: Date,
  ) {
    // 원본 시간 부분 추출 ("19:30", "21:00")
    const startTimePart = originalStart.split(' ')[1]; // "19:30"
    const endTimePart = originalEnd.split(' ')[1]; // "21:00"

    // 새로운 날짜를 YYYY-MM-DD 형식으로 변환
    const newDateStr = newDate.toISOString().split('T')[0]; // "2025-09-15"

    // 새로운 날짜 + 기존 시간 조합
    const newStart = `${newDateStr} ${startTimePart}`;
    const newEnd = `${newDateStr} ${endTimePart}`;

    return { newStart, newEnd };
  }
}
