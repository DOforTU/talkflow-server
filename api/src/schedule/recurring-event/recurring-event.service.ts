import { Injectable } from '@nestjs/common';
import { RecurringEventRepository } from './recurring-event.repository';
import { RecurringEvent } from '@prisma/client';
import { RecurringData } from '../event/event.service';

interface CreateRecurringEventData {
  rule: string;
  startDate: Date;
  endDate?: Date;
  title: string;
  description?: string;
  colorCode: string;
  userId: number;
  locationId?: number;
}

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
    tx: any,
    userId: number,
    eventData: any,
    recurring: RecurringData,
    locationId?: number,
  ): Promise<RecurringEvent> {
    const startDate = new Date(recurring.startDate);
    const endDate = recurring.endDate ? new Date(recurring.endDate) : null;

    return await tx.recurringEvent.create({
      data: {
        rule: recurring.rule,
        startDate,
        endDate,
        title: eventData.title,
        description: eventData.description,
        colorCode: eventData.colorCode,
        userId,
        locationId,
      },
      include: {
        user: true,
        location: true,
      },
    });
  }
}
