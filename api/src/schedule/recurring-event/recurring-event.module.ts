import { Module } from '@nestjs/common';
import { RecurringEventService } from './recurring-event.service';
import { RecurringEventRepository } from './recurring-event.repository';

@Module({
  providers: [RecurringEventService, RecurringEventRepository],
  exports: [RecurringEventService, RecurringEventRepository],
})
export class RecurringEventModule {}
