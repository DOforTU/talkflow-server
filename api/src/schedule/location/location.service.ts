import { Injectable } from '@nestjs/common';
import { LocationRepository } from './location.repository';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async createLocation(createLocationDto: CreateLocationDto) {
    return this.locationRepository.createLocation(createLocationDto);
  }
}