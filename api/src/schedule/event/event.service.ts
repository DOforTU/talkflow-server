import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEvent(userId: number, createEventDto: CreateEventDto) {
    return await this.prismaService.$transaction(async (tx) => {
      const { recurring, location, ...eventData } = createEventDto;

      // 위치 정보가 있다면 먼저 생성
      let locationId: number | undefined;
      if (location) {
        const createdLocation = await tx.location.create({
          data: location,
        });
        locationId = createdLocation.id;
      }

      // 반복 일정인 경우
      if (recurring) {
        const recurringEventData = {
          rule: recurring.rule,
          startDate: new Date(recurring.startDate),
          endDate: new Date(recurring.endDate),
          title: eventData.title,
          description: eventData.description,
          colorCode: eventData.colorCode,
          userId,
          locationId,
        };

        // 반복 일정 생성
        const recurringEvent = await tx.recurringEvent.create({
          data: recurringEventData,
          include: {
            user: true,
            location: true,
          },
        });

        // 첫 번째 이벤트를 생성 (반복 일정에 연결)
        const firstEvent = await tx.event.create({
          data: {
            ...eventData,
            startTime: new Date(eventData.startTime),
            endTime: new Date(eventData.endTime),
            isAllDay: eventData.isAllDay || false,
            userId,
            locationId,
            recurringEventId: recurringEvent.id,
          },
          include: {
            user: true,
            location: true,
            recurringEvent: true,
          },
        });

        return {
          event: firstEvent,
          recurringEvent,
          isRecurring: true,
        };
      } else {
        // 일반 일정 생성
        const event = await tx.event.create({
          data: {
            ...eventData,
            startTime: new Date(eventData.startTime),
            endTime: new Date(eventData.endTime),
            isAllDay: eventData.isAllDay || false,
            userId,
            locationId,
          },
          include: {
            user: true,
            location: true,
            recurringEvent: true,
          },
        });

        return {
          event,
          isRecurring: false,
        };
      }
    });
  }
}
