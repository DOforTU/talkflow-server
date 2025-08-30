import { Injectable } from '@nestjs/common';
import { LocationRepository } from './location.repository';
import { CreateLocationDto } from './location.dto';
import { Location } from '@prisma/client';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async createLocation(
    createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    return await this.locationRepository.createLocation(createLocationDto);
  }

  /**
   * 트랜잭션 내에서 위치 정보가 있으면 생성하고 ID 반환
   */
  async createLocationIfNeeded(
    tx: any,
    location?: CreateLocationDto | null,
  ): Promise<number | undefined> {
    if (!location) return undefined;

    const createdLocation = await tx.location.create({
      data: location,
    });
    const createdLocationId: number = createdLocation.id;
    return createdLocationId;
  }
}
