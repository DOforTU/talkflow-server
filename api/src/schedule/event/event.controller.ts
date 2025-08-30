import { User, Event } from '@prisma/client';
import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './event.dto';
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
      return await this.eventService.createEvents(req.user.id, createEventDto);
    }
    return await this.eventService.createSingleEvent(
      req.user.id,
      createEventDto,
    );
  }
}
