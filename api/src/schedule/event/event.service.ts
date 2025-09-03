import { EventRepository } from './event.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateEventDto,
  EventData,
  ResponseEventDto,
  UpdateEventDto,
} from './event.dto';
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

  // ===== UPDATE =====

  /**
   * 단일 이벤트 업데이트
   * @param userId
   * @param eventId
   * @param updateEventDto
   * @returns
   */
  async updateSingleEvent(
    userId: number,
    eventId: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.getEventById(eventId, userId);
    const { location, recurring, ...eventData } = updateEventDto;

    // 위치 업데이트 처리(location 없으면 어차피 undefined)
    const locationId =
      await this.locationService.createLocationIfNeeded(location);

    // 원래 반복이 있었지만, 업데이트 DTO에 반복이 사라졌다면, 모든 반복 일정 삭제 후 현재 일정만 남김
    if (event.recurringEventId && !updateEventDto.recurring) {
      await this.eventRepository.deleteRecurringEvents(userId, eventId);
    }

    return await this.eventRepository.updateSingleEvent(
      userId,
      eventId,
      eventData,
      locationId,
    );
  }

  /**
   * 반복 이벤트 전체 업데이트
   * @param userId
   * @param eventId
   * @param updateEventDto
   * @returns
   */
  async updateRecurringEvents(
    userId: number,
    eventId: number,
    updateEventDto: UpdateEventDto,
  ): Promise<void> {
    const event = await this.getEventById(eventId, userId);
    if (!event.recurringEventId) {
      throw new BadRequestException('Event is not part of a recurring series');
    }

    const { location, recurring, ...eventData } = updateEventDto;

    // 위치 업데이트 처리(location 없으면 어차피 undefined)
    const locationId =
      await this.locationService.createLocationIfNeeded(location);

    return await this.prismaService.$transaction(async (tx) => {
      // 모든 반복 이벤트 업데이트
      await this.eventRepository.updateEventsByRecurringEventId(
        userId,
        event.recurringEventId!,
        eventData,
        locationId,
      );

      // RecurringEvent 업데이트 (필요한 경우)
      if (recurring) {
        await this.recurringEventService.updateRecurringEventWithTransaction(
          tx,
          userId,
          event.recurringEventId!,
          recurring,
        );
      }
    });
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

    // 1. RecurringEvent 조회
    const recurringEvent =
      await this.recurringEventService.getRecurringEventById(
        userId,
        event.recurringEventId,
      );

    // 2. 새로운 종료 날짜 계산
    const { untilDateStr, endDateStr } = this.calculateNewEndDate(
      event.startTime,
    );
    const updatedRule = this.updateRRuleWithUntil(
      recurringEvent.rule,
      untilDateStr,
    );

    // 3. 트랜잭션으로 실행
    return await this.prismaService.$transaction(async (tx) => {
      // 미래 이벤트들 소프트 삭제
      await this.eventRepository.softDeleteFutureEventsByTransaction(
        tx,
        userId,
        event.recurringEventId!,
        event.startTime,
      );

      // RecurringEvent 업데이트
      await this.eventRepository.updateRecurringEventRuleByTransaction(
        tx,
        event.recurringEventId!,
        updatedRule,
        endDateStr,
      );
    });
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

  // ===== Sub Functions =====

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
    endDateStr: string,
  ): string[] {
    try {
      // 문자열을 직접 DTSTART로 사용 (시간대 변환 없음)
      const dtstart = startDateStr.replace(/-/g, '') + 'T000000'; // "20250125T000000"

      const rule = RRule.fromString(`DTSTART:${dtstart}\nRRULE:${rruleString}`);

      // 종료 날짜 설정 (프론트에서 항상 전달됨)
      const endDate = new Date(endDateStr!);

      // RRule에서 날짜들을 생성하고 문자열로 변환
      return rule
        .all((date) => date <= endDate)
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
   * 새로운 종료 날짜 계산
   * @param fromStartTime 시작 시간
   * @returns untilDateStr과 endDateStr
   */
  private calculateNewEndDate(fromStartTime: string): {
    untilDateStr: string;
    endDateStr: string;
  } {
    // fromStartTime에서 하루 전 날짜를 계산
    const fromDate = new Date(fromStartTime.split(' ')[0]);
    const untilDate = new Date(fromDate);
    untilDate.setDate(untilDate.getDate() - 1);

    // RRULE에 UNTIL 추가 (날짜만 사용, 시간대 무관)
    const untilDateStr =
      untilDate.getFullYear() +
      String(untilDate.getMonth() + 1).padStart(2, '0') +
      String(untilDate.getDate()).padStart(2, '0'); // YYYYMMDD 형식

    // endDate를 선택한 날짜의 전날로 설정
    const endDateStr = untilDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

    return { untilDateStr, endDateStr };
  }

  /**
   * RRULE에 UNTIL 날짜 추가/업데이트
   * @param currentRule 현재 RRULE
   * @param untilDateStr UNTIL 날짜 문자열
   * @returns 업데이트된 RRULE
   */
  private updateRRuleWithUntil(
    currentRule: string,
    untilDateStr: string,
  ): string {
    if (currentRule.includes('UNTIL=')) {
      // 기존 UNTIL을 새로운 날짜로 교체
      return currentRule.replace(
        /UNTIL=\d{8}(T\d{6}Z?)?/,
        `UNTIL=${untilDateStr}`,
      );
    } else {
      // UNTIL 추가 (날짜만, 시간 없음)
      return currentRule + `;UNTIL=${untilDateStr}`;
    }
  }
}
