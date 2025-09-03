import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringEventRepository } from './recurring-event.repository';
import { Prisma, RecurringEvent } from '@prisma/client';
import {
  CreateRecurringEventData,
  RecurringData,
  ResponseRecurringEventDto,
} from './recurring-event.dto';
import { EventData } from '../event/event.dto';

@Injectable()
export class RecurringEventService {
  constructor(
    private readonly recurringEventRepository: RecurringEventRepository,
  ) {}

  // ===== CREATE =====

  async createRecurringEvent(
    data: CreateRecurringEventData,
  ): Promise<RecurringEvent> {
    return await this.recurringEventRepository.createRecurringEvent(data);
  }

  /**
   * 트랜잭션 내에서 반복 일정 레코드 생성
   */
  async createRecurringEventWithTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    eventData: EventData,
    recurring: RecurringData,
    locationId?: number,
  ): Promise<RecurringEvent> {
    // RRULE에 UNTIL 추가 (endDate를 UNTIL 형식으로 변환)
    let ruleWithUntil = recurring.rule;
    if (recurring.endDate && !recurring.rule.includes('UNTIL=')) {
      const endDate = new Date(recurring.endDate);
      const untilDateStr =
        endDate.getFullYear() +
        String(endDate.getMonth() + 1).padStart(2, '0') +
        String(endDate.getDate()).padStart(2, '0'); // YYYYMMDD 형식
      ruleWithUntil += `;UNTIL=${untilDateStr}`;
    }

    // recurring 업데이트
    recurring.rule = ruleWithUntil;

    return await this.recurringEventRepository.createRecurringEventWithTransaction(
      tx,
      userId,
      eventData,
      recurring,
      locationId,
    );
  }

  // ===== READ =====

  async getRecurringEventById(
    userId: number,
    id: number,
  ): Promise<ResponseRecurringEventDto> {
    const recurring = await this.recurringEventRepository.findById(userId, id);

    if (!recurring) {
      throw new NotFoundException('Recurring event not found');
    }

    return recurring;
  }
}
