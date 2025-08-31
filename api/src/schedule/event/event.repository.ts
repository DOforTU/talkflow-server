import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Event, Prisma } from '@prisma/client';
import { EventData } from './event.dto';

@Injectable()
export class EventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ===== CREATE =====

  async createSingleEvent(
    userId: number,
    eventData: EventData,
    locationId?: number,
  ): Promise<Event> {
    return await this.prismaService.event.create({
      data: {
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        isAllDay: eventData.isAllDay,
        userId,
        locationId,
      },
    });
  }

  async createEventByTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    recurringEventId: number,
    eventData: EventData,
    newStart: Date,
    newEnd: Date,
    locationId?: number,
  ): Promise<Event> {
    return await tx.event.create({
      data: {
        ...eventData,
        startTime: newStart,
        endTime: newEnd,
        isAllDay: eventData.isAllDay,
        userId,
        locationId,
        recurringEventId,
      },
    });
  }

  // ===== READ =====

  async findEventsByUserId(userId: number): Promise<Event[]> {
    return await this.prismaService.event.findMany({
      where: { userId },
    });
  }
}
