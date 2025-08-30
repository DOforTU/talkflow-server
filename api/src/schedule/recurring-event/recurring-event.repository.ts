import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RecurringEvent } from '@prisma/client';

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
