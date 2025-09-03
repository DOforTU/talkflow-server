import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RecurringEvent } from '@prisma/client';
import {
  CreateRecurringEventData,
  ResponseRecurringEventDto,
} from './recurring-event.dto';

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

  async findById(
    userId: number,
    id: number,
  ): Promise<ResponseRecurringEventDto | null> {
    return await this.prismaService.recurringEvent.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        rule: true,
        startDate: true,
        endDate: true,
        title: true,
        description: true,
        colorCode: true,
        startTime: true,
        endTime: true,
        version: true,
      },
    });
  }
}
