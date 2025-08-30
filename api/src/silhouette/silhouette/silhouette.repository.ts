import { Injectable } from '@nestjs/common';
import { content_enum, Silhouette } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateSilhouettesDto } from './silhoutette.dto';

@Injectable()
export class SilhouetteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSilhouette(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
    type: content_enum,
  ): Promise<Silhouette> {
    return await this.prisma.silhouette.create({
      data: { ...createSilhouettesDto, userId, type },
    });
  }

  async findById(id: number): Promise<Silhouette | null> {
    return await this.prisma.silhouette.findFirst({
      where: { id, deletedAt: null },
    });
  }
}
