import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from 'src/account/auth/jwt';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(
    @Request() req: any,
    @Body() createEventDto: CreateEventDto,
  ) {
    const userId = req.user.id;
    return this.eventService.createEvent(userId, createEventDto);
  }
}
