import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RecurringEvent } from '@prisma/client';
import { CreateRecurringEventData } from './recurring-event.dto';

@Injectable()
export class RecurringEventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createRecurringEvent(
    data: CreateRecurringEventData,
  ): Promise<RecurringEvent> {
    return await this.prismaService.recurringEvent.create({
      data,
      include: {
        user: true,
        location: true,
      },
    });
  }
}
