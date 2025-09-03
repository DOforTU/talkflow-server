import { User, Event } from '@prisma/client';
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, ResponseEventDto } from './event.dto';
import { OnBoardingGuard } from 'src/common/guards/onboarding.guard';

@Controller('events')
@UseGuards(OnBoardingGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ===== CREATE =====

  @Post()
  async createEvent(
    @Request() req: { user: User },
    @Body() createEventDto: CreateEventDto,
  ): Promise<Event | Event[]> {
    if (createEventDto.recurring) {
      // 반복 일정이라면 여러 이벤트 생성
      return await this.eventService.createEvents(req.user.id, createEventDto);
    }
    // 반복 일정이 아니라면 단일 이벤트 생성
    return await this.eventService.createSingleEvent(
      req.user.id,
      createEventDto,
    );
  }

  // ===== READ =====

  @Get()
  async getMyEvents(
    @Request() req: { user: User },
  ): Promise<ResponseEventDto[]> {
    return await this.eventService.getMyEvents(req.user.id);
  }

  // ===== DELETE =====

  /**
   * 단일 이벤트 삭제
   * @param req
   * @param eventId
   * @returns
   */
  @Delete(':id')
  async deleteSingleEvent(
    @Request() req: { user: User },
    @Param('id', ParseIntPipe) eventId: number,
  ): Promise<Event> {
    return await this.eventService.deleteSingleEvent(req.user.id, eventId);
  }

  /**
   * 반복 이벤트 삭제 및 관련된 일정 모두 삭제
   * @param req
   * @param eventId
   * @returns
   */
  @Delete(':id/recurring/all')
  async deleteRecurringEvents(
    @Request() req: { user: User },
    @Param('id', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return await this.eventService.deleteRecurringEvents(req.user.id, eventId);
  }
}
