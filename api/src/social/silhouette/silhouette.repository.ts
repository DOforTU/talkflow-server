import { Injectable } from '@nestjs/common';
import { content_enum, Silhouette } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateSilhouettesDto } from './silhoutette.dto';

@Injectable()
export class SilhouetteRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----- CREATE -----

  async createSilhouette(
    profileId: number,
    createSilhouettesDto: CreateSilhouettesDto,
    type: content_enum,
  ): Promise<Silhouette> {
    return await this.prisma.silhouette.create({
      data: { ...createSilhouettesDto, profileId, type },
    });
  }

  // ----- READ -----

  async findById(id: number): Promise<Silhouette | null> {
    return await this.prisma.silhouette.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // ----- UPDATE -----

  async updateIsPublic(id: number, isPublic: boolean): Promise<Silhouette> {
    return await this.prisma.silhouette.update({
      where: { id },
      data: { isPublic },
    });
  }

  // ----- DELETE -----

  async deleteSilhouette(id: number): Promise<Silhouette> {
    return await this.prisma.silhouette.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
