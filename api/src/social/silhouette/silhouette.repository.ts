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

  async findPublicSilhouettesOrderByLatest(
    limit: number = 20,
    offset: number = 0,
  ): Promise<Silhouette[]> {
    // 먼저 실루엣 ID만 가져오기
    const silhouetteIds = await this.prisma.silhouette.findMany({
      where: { isPublic: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: { id: true },
    });

    if (silhouetteIds.length === 0) {
      return [];
    }

    // 해당 ID의 실루엣들을 조회
    return await this.prisma.silhouette.findMany({
      where: { id: { in: silhouetteIds.map((s) => s.id) } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----- UPDATE -----

  async updateIsPublic(
    id: number,
    profileId: number,
    isPublic: boolean,
  ): Promise<Silhouette> {
    return await this.prisma.silhouette.update({
      where: { id, profileId },
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
