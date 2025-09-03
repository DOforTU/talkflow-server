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
        recurringEventId: true,
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
    });
  }

  async findById(eventId: number, userId: number): Promise<Event | null> {
    return await this.prismaService.event.findFirst({
      where: {
        id: eventId,
        userId: userId,
        deletedAt: null,
      },
    });
  }

  // ===== DELETE =====

  async deleteSingleEvent(userId: number, eventId: number): Promise<Event> {
    // Soft delete a single event (verify ownership)
    return await this.prismaService.event.update({
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

  async deleteRecurringEvents(
    userId: number,
    recurringEventId: number,
  ): Promise<void> {
    await this.prismaService.event.updateMany({
      where: {
        recurringEventId: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prismaService.recurringEvent.updateMany({
      where: {
        id: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
