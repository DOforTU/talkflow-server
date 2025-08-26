import { Injectable } from '@nestjs/common';
import { CreateSilhouettesDto } from './silhoutette.dto';
import { SilhouetteRepository } from './silhouette.repository';
import { Silhouette } from '@prisma/client';

@Injectable()
export class SilhouetteService {
  constructor(private readonly silhouetteRepository: SilhouetteRepository) {}

  async createSilhouettes(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    // Silhouette 생성 로직 구현
    const type = await this.getTypeByUrl(createSilhouettesDto.contentUrl);
    const silhouetteDtoWithType = { ...createSilhouettesDto, type };
    return await this.silhouetteRepository.createSilhouette(
      userId,
      silhouetteDtoWithType,
    );
  }

  getTypeByUrl(contentUrl: string): 'image' | 'video' | null {
    if (!contentUrl) return null;
    const lowerUrl = contentUrl.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/)) {
      return 'image';
    }
    if (lowerUrl.match(/\.(mp4|mov|avi|wmv|webm|mkv)$/)) {
      return 'video';
    }
    return null; // 기타 확장자
  }
}
