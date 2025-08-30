import { Injectable } from '@nestjs/common';
import { SilhouetteLikeRepository } from './silhouette-like.repository';
import { SilhouetteLike } from '@prisma/client';
import { SilhouetteService } from '../silhouette/silhouette.service';

@Injectable()
export class SilhouetteLikeService {
  constructor(
    private readonly silhouetteLikeRepository: SilhouetteLikeRepository,
    private readonly silhouetteService: SilhouetteService,
  ) {}

  // ----- SUB FUNCTION -----

  // 고민하는 방식 이게 소프트딜리트다 보니까 좋아요 취소한 게시글을 다시 좋아요 누른경우를 생각하면 update로 복구해야함
  // create랑 update랑 delete를 한번에 처리하는게 좋을지
  // 아니면 각각의 기능을 나누는게 좋을지

  async toggleLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike> {
    await this.silhouetteService.getSilhouetteById(silhouetteId);

    const existingLike = await this.silhouetteLikeRepository.isExistingLike(
      userId,
      silhouetteId,
    );

    if (existingLike) {
      if (existingLike.deletedAt === null) {
        // 이미 좋아요 상태 -> 취소(soft delete)
        return await this.silhouetteLikeRepository.removeLike(
          userId,
          silhouetteId,
        );
      } else {
        // soft delete 상태면 복구
        return await this.silhouetteLikeRepository.restoreLike(
          userId,
          silhouetteId,
        );
      }
    } else {
      // 기존 좋아요 없으면 새로 생성
      return await this.silhouetteLikeRepository.createLike(
        userId,
        silhouetteId,
      );
    }
  }
}
