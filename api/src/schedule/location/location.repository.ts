import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './location.dto';
import { Location } from '@prisma/client';

@Injectable()
export class LocationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createLocation(data: CreateLocationDto): Promise<Location> {
    return await this.prismaService.location.create({
      data,
    });
  }
}
