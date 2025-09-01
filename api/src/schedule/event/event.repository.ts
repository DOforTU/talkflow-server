import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Event, Prisma } from '@prisma/client';
import { EventData, ResponseEventDto } from './event.dto';

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
        startTime: eventData.startTime, // 이미 문자열 형태
        endTime: eventData.endTime, // 이미 문자열 형태
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
    newStart: string, // 문자열로 변경
    newEnd: string, // 문자열로 변경
    locationId?: number,
  ): Promise<Event> {
    return await tx.event.create({
      data: {
        ...eventData,
        startTime: newStart, // 이미 문자열 형태
        endTime: newEnd, // 이미 문자열 형태
        isAllDay: eventData.isAllDay,
        userId,
        locationId,
        recurringEventId,
      },
    });
  }

  // ===== READ =====

  async findEventsByUserId(userId: number): Promise<ResponseEventDto[]> {
    return await this.prismaService.event.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        isAllDay: true,
        colorCode: true,
        version: true,

        // time columns
        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        // parts of relations
        userId: true,
        location: {
          select: {
            id: true,
            nameKo: true,
            nameEn: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        recurringEvent: {
          select: {
            id: true,
            rule: true,
            startDate: true,
            endDate: true,
            title: true,
            description: true,
            colorCode: true,
            version: true,
            location: {
              select: {
                id: true,
                nameKo: true,
                nameEn: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });
  }

  // ===== DELETE =====

  async deleteSingleEvent(userId: number, eventId: number): Promise<void> {
    // Soft delete a single event (verify ownership)
    await this.prismaService.event.update({
      where: {
        id: eventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteRecurringEvents(userId: number, eventId: number): Promise<void> {
    // First, find the event to get the recurringEventId
    const event = await this.prismaService.event.findFirst({
      where: {
        id: eventId,
        userId: userId,
        deletedAt: null,
      },
      select: {
        recurringEventId: true,
      },
    });

    if (!event?.recurringEventId) {
      throw new Error('Event is not part of a recurring series');
    }

    // Soft delete all events in the recurring series
    await this.prismaService.event.updateMany({
      where: {
        recurringEventId: event.recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Also soft delete the recurring event metadata
    await this.prismaService.recurringEvent.updateMany({
      where: {
        id: event.recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
