import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSilhouettesDto } from './silhoutette.dto';
import { SilhouetteRepository } from './silhouette.repository';
import { content_enum, Silhouette } from '@prisma/client';

@Injectable()
export class SilhouetteService {
  constructor(private readonly silhouetteRepository: SilhouetteRepository) {}

  // ----- CREATE -----

  async createSilhouettes(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    // Silhouette 생성 로직 구현
    const type = this.getTypeByUrl(createSilhouettesDto.contentUrl);
    console.log('determined type:', type);
    return await this.silhouetteRepository.createSilhouette(
      userId,
      createSilhouettesDto,
      type,
    );
  }

  // ----- READ -----

  // URL에서 파일 확장자를 기반으로 타입 결정
  // 동기식 함수로 변경 url검사후 바로 리턴
  private getTypeByUrl(contentUrl: string): content_enum {
    if (!contentUrl) {
      throw new BadRequestException('Content URL is required');
    }
    const urlWithoutParams = contentUrl.toLowerCase().split('?')[0];
    if (urlWithoutParams.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/)) {
      return content_enum.image;
    }
    if (urlWithoutParams.match(/\.(mp4|mov|avi|wmv|webm|mkv)$/)) {
      return content_enum.video;
    }
    throw new BadRequestException('Invalid content URL');
  }

  // ----- SUB FUNCTION -----

  async getSilhouetteById(id: number): Promise<Silhouette> {
    const silhouette = await this.silhouetteRepository.findById(id);
    if (!silhouette) {
      throw new NotFoundException('Silhouette not found');
    }
    return silhouette;
  }
}
