import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Event } from '@prisma/client';

interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  colorCode: string;
  userId: number;
  locationId?: number;
  recurringEventId?: number;
}

@Injectable()
export class EventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<Event> {
    return await this.prismaService.event.create({
      data,
      include: {
        user: true,
        location: true,
        recurringEvent: true,
      },
    });
  }
}
