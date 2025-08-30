import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationRepository } from './location.repository';

@Module({
  providers: [LocationService, LocationRepository],
  exports: [LocationService, LocationRepository],
})
export class LocationModule {}