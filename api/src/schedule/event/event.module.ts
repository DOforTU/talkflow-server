import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';
import { RecurringEventModule } from '../recurring-event/recurring-event.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [RecurringEventModule, LocationModule],
  controllers: [EventController],
  providers: [EventService, EventRepository],
  exports: [EventService, EventRepository],
})
export class EventModule {}
