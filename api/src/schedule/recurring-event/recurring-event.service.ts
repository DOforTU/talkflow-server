import { Injectable } from '@nestjs/common';
import { RecurringEventRepository } from './recurring-event.repository';
import { RecurringEvent } from '@prisma/client';

interface CreateRecurringEventData {
  rule: string;
  startDate: Date;
  endDate: Date;
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
}
