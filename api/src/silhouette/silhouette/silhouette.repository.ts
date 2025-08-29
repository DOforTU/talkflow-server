import { Injectable } from '@nestjs/common';
import { Silhouette, User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateSilhouettesDto } from './silhoutette.dto';

@Injectable()
export class SilhouetteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSilhouette(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
    type: 'image' | 'video' | null,
  ): Promise<Silhouette> {
    return this.prisma.silhouette.create({
      data: { ...createSilhouettesDto, userId, type },
    });
  }

  async getSilhouetteById(silhouetteId: number): Promise<Silhouette | null> {
    return this.prisma.silhouette.findUnique({
      where: { id: silhouetteId, deletedAt: null },
    });
  }
}
