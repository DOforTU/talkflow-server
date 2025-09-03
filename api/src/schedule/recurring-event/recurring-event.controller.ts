import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RecurringEventService } from './recurring-event.service';
import { OnBoardingGuard } from 'src/common/guards/onboarding.guard';
import { RecurringEvent, User } from '@prisma/client';
import { ResponseRecurringEventDto } from './recurring-event.dto';

@Controller('recurring-event')
@UseGuards(OnBoardingGuard)
export class RecurringEventController {
  constructor(private readonly recurringEventService: RecurringEventService) {}

  @Get(':id')
  async getRecurringEventById(
    @Request() req: { user: User },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseRecurringEventDto> {
    return await this.recurringEventService.getRecurringEventById(
      req.user.id,
      id,
    );
  }
}
