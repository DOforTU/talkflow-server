import { User, Event } from '@prisma/client';
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, ResponseEventDto } from './event.dto';
import { JwtAuthGuard } from 'src/account/auth/jwt';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

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

  @Get()
  async getMyEvents(
    @Request() req: { user: User },
  ): Promise<ResponseEventDto[]> {
    return await this.eventService.getMyEvents(req.user.id);
  }
}
