import { Injectable } from '@nestjs/common';
import { RecurringEventRepository } from './recurring-event.repository';
import { Prisma, RecurringEvent } from '@prisma/client';
import { CreateRecurringEventData, RecurringData } from './recurring-event.dto';
import { EventData } from '../event/event.dto';

@Injectable()
export class RecurringEventService {
  constructor(
    private readonly recurringEventRepository: RecurringEventRepository,
  ) {}

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
    return await tx.recurringEvent.create({
      data: {
        rule: recurring.rule,
        startDate: recurring.startDate, // 이미 문자열
        endDate: recurring.endDate || null,
        title: eventData.title,
        description: eventData.description,
        colorCode: eventData.colorCode,
        userId,
        locationId,
      },
    });
  }
}
