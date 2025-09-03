import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma, RecurringEvent } from '@prisma/client';
import {
  CreateRecurringEventData,
  RecurringData,
  ResponseRecurringEventDto,
  UpdateRecurringEventDto,
} from './recurring-event.dto';
import { EventData } from '../event/event.dto';

@Injectable()
export class RecurringEventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 트랜잭션 내에서 반복 일정 레코드 생성
   */
  async createRecurringEventWithTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    eventData: EventData,
    recurring: RecurringData,
    locationId?: number,
  ): Promise<RecurringEvent> {
    return await tx.recurringEvent.create({
      data: {
        rule: recurring.rule,
        startDate: recurring.startDate, // 이미 문자열
        endDate: recurring.endDate, // 프론트에서 항상 전달됨
        title: eventData.title,
        description: eventData.description,
        colorCode: eventData.colorCode,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        userId,
        locationId,
      },
    });
  }

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
    id: number,
    userId: number,
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

  // ===== UPDATE =====

  /**
   * 트랜잭션 내에서 반복 이벤트 업데이트
   */
  async updateRecurringEventWithTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    userId: number,
    recurringEventId: number,
    updateData: UpdateRecurringEventDto,
  ): Promise<void> {
    await tx.recurringEvent.update({
      where: {
        id: recurringEventId,
        userId: userId,
        deletedAt: null,
      },
      data: {
        ...updateData,
        version: {
          increment: 1,
        },
      },
    });
  }
}
