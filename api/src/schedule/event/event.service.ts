import { EventRepository } from './event.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto, EventData, ResponseEventDto } from './event.dto';
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

  // ===== READ =====
  async getMyEvents(userId: number): Promise<ResponseEventDto[]> {
    return await this.eventRepository.findEventsByUserId(userId);
  }

  async getEventById(eventId: number, userId: number): Promise<Event> {
    const event = await this.eventRepository.findById(eventId, userId);
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
    await this.getEventById(eventId, userId); // 존재 여부 확인
    return await this.eventRepository.deleteSingleEvent(userId, eventId);
  }

  /**
   * 반복 이벤트 삭제 및 관련된 일정 모두 삭제
   * @param userId
   * @param eventId
   * @returns
   */
  async deleteRecurringEvents(userId: number, eventId: number): Promise<void> {
    const event = await this.getEventById(eventId, userId);
    if (!event.recurringEventId) {
      throw new BadRequestException('Event is not part of a recurring series');
    }
    return await this.eventRepository.deleteRecurringEvents(
      userId,
      event.recurringEventId,
    );
  }

  /**
   * 현재 일정부터 이후의 모든 반복 일정 삭제
   * @param userId
   * @param eventId
   * @returns
   */
  async deleteEventsFromThis(userId: number, eventId: number): Promise<void> {
    const event = await this.getEventById(eventId, userId);
    if (!event.recurringEventId) {
      throw new BadRequestException('Event is not part of a recurring series');
    }
    return await this.eventRepository.deleteEventsFromThis(
      userId,
      event.recurringEventId,
      event.startTime,
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
    const originalStart = eventData.startTime; // 이미 문자열
    const originalEnd = eventData.endTime; // 이미 문자열

    // 반복 날짜들 생성 (문자열 기반), 언제부터 언제까지가 아니라 "언제부터 언제까지의 반복 주기별 날짜들"
    const recurringDateStrings: string[] = this.generateRecurringDateStrings(
      recurring.rule,
      recurring.startDate,
      recurring.endDate,
    );

    // 각 날짜별 이벤트 생성
    const events: Event[] = [];
    for (const recurringDateStr of recurringDateStrings) {
      const { newStart, newEnd } = this.calculateEventTimes(
        originalStart,
        originalEnd,
        recurringDateStr,
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
   * RRULE에서 반복 날짜들을 생성 (문자열 기반)
   * @param rruleString RRULE 문자열
   * @param startDateStr 시작 날짜 "2025-01-25"
   * @param endDateStr 종료 날짜 "2026-01-25" (없으면 6개월 후)
   * @returns 반복 날짜 문자열 배열
   */
  private generateRecurringDateStrings(
    rruleString: string,
    startDateStr: string,
    endDateStr?: string,
  ): string[] {
    try {
      // 문자열을 직접 DTSTART로 사용 (시간대 변환 없음)
      const dtstart = startDateStr.replace(/-/g, '') + 'T000000'; // "20250125T000000"

      const rule = RRule.fromString(`DTSTART:${dtstart}\nRRULE:${rruleString}`);

      // 종료 날짜 설정 (주기별 차등 적용)
      const endDate = endDateStr
        ? new Date(endDateStr)
        : this.calculateDefaultEndDate(rruleString, startDateStr);

      // RRule에서 날짜들을 생성하고 문자열로 변환
      return rule
        .all((date, i) => date <= endDate && i < 100)
        .map((date) => {
          // Date를 로컬 날짜 문자열로 변환 (시간대 변환 없음)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        });
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return [startDateStr]; // 파싱 실패시 원래 날짜만 반환
    }
  }

  /**
   * 개별 이벤트의 시작/종료 시간 계산 (문자열 형태)
   * @param originalStart 원래 시작 시간 "2025-09-01 19:30"
   * @param originalEnd 원래 종료 시간 "2025-09-01 21:00"
   * @param newDateStr 새로운 날짜 문자열 "2025-09-15"
   * @returns 새로운 시작/종료 시간 문자열
   */
  private calculateEventTimes(
    originalStart: string,
    originalEnd: string,
    newDateStr: string,
  ) {
    // 원본 시간 부분 추출 ("19:30", "21:00")
    const startTimePart = originalStart.split(' ')[1]; // "19:30"
    const endTimePart = originalEnd.split(' ')[1]; // "21:00"

    // 새로운 날짜 + 기존 시간 조합 (시간대 변환 없음)
    const newStart = `${newDateStr} ${startTimePart}`;
    const newEnd = `${newDateStr} ${endTimePart}`;

    return { newStart, newEnd };
  }

  /**
   * 반복 주기에 따라 기본 종료일 계산
   * @param rruleString RRULE 문자열
   * @param startDateStr 시작 날짜
   * @returns 기본 종료일
   */
  private calculateDefaultEndDate(
    rruleString: string,
    startDateStr: string,
  ): Date {
    const startDate = new Date(startDateStr);

    // YEARLY인 경우 5년 후 (5번 실행되도록)
    if (rruleString.includes('YEARLY')) {
      return new Date(
        startDate.getFullYear() + 5,
        startDate.getMonth(),
        startDate.getDate(),
      );
    }

    // 그 외의 경우 1년 후
    return new Date(startDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000);
  }
}
