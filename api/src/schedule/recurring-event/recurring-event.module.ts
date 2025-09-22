import { Module } from '@nestjs/common';
import { RecurringEventService } from './recurring-event.service';
import { RecurringEventRepository } from './recurring-event.repository';
import { RecurringEventController } from './recurring-event.controller';

@Module({
  providers: [RecurringEventService, RecurringEventRepository],
  exports: [RecurringEventService, RecurringEventRepository],
  controllers: [RecurringEventController],
})
export class RecurringEventModule {}
