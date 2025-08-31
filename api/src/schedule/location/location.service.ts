import { Injectable } from '@nestjs/common';
import { LocationRepository } from './location.repository';
import { CreateLocationDto } from './location.dto';
import { Location, Prisma } from '@prisma/client';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async createLocation(
    createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    return await this.locationRepository.createLocation(createLocationDto);
  }

  /**
   * 위치 정보가 있으면 생성하고 ID 반환
   */
  async createLocationIfNeeded(
    location?: CreateLocationDto | null,
  ): Promise<number | undefined> {
    if (!location) return undefined;

    const createdLocation =
      await this.locationRepository.createLocation(location);
    const createdLocationId: number = createdLocation.id;
    return createdLocationId;
  }
}
