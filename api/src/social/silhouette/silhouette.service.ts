import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSilhouettesDto, ResponseSilhouette } from './silhoutette.dto';
import { SilhouetteRepository } from './silhouette.repository';
import { content_enum, Silhouette } from '@prisma/client';
import { ProfileService } from 'src/account/profile/profile.service';

@Injectable()
export class SilhouetteService {
  constructor(
    private readonly silhouetteRepository: SilhouetteRepository,
    private readonly profileService: ProfileService,
  ) {}

  // ----- CREATE -----

  async createSilhouettes(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    // Silhouette 생성 로직 구현
    const type = this.getTypeByUrl(createSilhouettesDto.contentUrl);
    const profile = await this.profileService.getProfileByUserId(userId);
    return await this.silhouetteRepository.createSilhouette(
      profile.id as number,
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

  async findPublicSilhouettesOrderByLatest(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ResponseSilhouette[]> {
    return await this.silhouetteRepository.findPublicSilhouettesOrderByLatest(
      limit,
      offset,
    );
  }

  // ----- UPDATE -----

  // isPublic 업데이트 -> silhouetteId로 실루엣 찾기 -> 있으면 공개로 할지 비공개로 할지 업데이트
  async updateIsPublic(
    silhouetteId: number,
    userId: number,
    isPublic: boolean,
  ): Promise<Silhouette> {
    const silhouette = await this.silhouetteRepository.findById(silhouetteId);
    if (!silhouette) {
      throw new NotFoundException('Silhouette not found for user');
    }
    const profile = await this.profileService.getProfileByUserId(userId);
    return await this.silhouetteRepository.updateIsPublic(
      silhouetteId,
      profile.id,
      isPublic,
    );
  }
  // ----- DELETE -----

  async deleteSilhouettes(silhouetteId: number): Promise<Silhouette> {
    const silhouette = await this.silhouetteRepository.findById(silhouetteId);
    if (!silhouette) {
      throw new NotFoundException('Silhouette not found for user');
    }
    return await this.silhouetteRepository.deleteSilhouette(silhouetteId);
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
