import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SilhouetteRepository } from '../silhouette/silhouette.repository';
import { SilhouetteLikeRepository } from './silhouette-like.repository';
import { SilhouetteLike } from '@prisma/client';

@Injectable()
export class SilhouetteLikeService {
  constructor(
    private readonly silhouetteLikeRepository: SilhouetteLikeRepository,
    private readonly silhouetteService: SilhouetteRepository,
  ) {}

  // ----- CREATE -----

  /**
   *
   * @param userId
   * @param silhouetteId
   * @returns
   * 예외처리
   * - 존재하지 않는 실루엣에 좋아요를 누르는 경우
   * - 이미 좋아요가 존재하는 경우 (중복 좋아요 방지)
   */
  async createLike(
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
        throw new ConflictException('이미 좋아요가 존재합니다.');
      }
      return this.silhouetteLikeRepository.restoreLike(userId, silhouetteId);
    }
    return this.silhouetteLikeRepository.createLike(userId, silhouetteId);
  }

  // ----- UPDATE -----

  /**
   *
   * @param userId
   * @param silhouetteId
   * 사용자가 같은 silhouette에 대해 좋아요를 취소한 후 다시 좋아요를 누르는 경우
   * 이때 예외처리.. 복구로 처리
   * 먼저 실루엣이 존재하는지 확인
   * 그 다음에 기존 좋아요가 존재하는지 확인
   * deletedAt이 null이 아닌 경우 복구
   * deletedAt이 null인 경우 이미 좋아요가 존재하므로 예외처리
   * 그러면 다시 좋아요를 누른 상태가 됨
   */
  async restoreLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike | null> {
    await this.silhouetteService.getSilhouetteById(silhouetteId);
    const existingLike = await this.silhouetteLikeRepository.isExistingLike(
      userId,
      silhouetteId,
    );
    if (existingLike) {
      if (existingLike.deletedAt === null) {
        throw new ConflictException('이미 좋아요가 존재합니다.');
      }
      // 복구
      return this.silhouetteLikeRepository.restoreLike(userId, silhouetteId);
    }
    return null;
  }

  // ----- DELETE -----

  /**
   *
   * @param userId
   * @param silhouetteId
   * @returns
   * 예외처리
   * - 존재하지 않는 실루엣에 좋아요를 취소하는 경우
   * - 좋아요가 존재하지 않는 경우 (취소할 좋아요가 없는 경우
   */
  async removeLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike | boolean> {
    await this.silhouetteService.getSilhouetteById(silhouetteId);

    const existingLike = await this.silhouetteLikeRepository.isExistingLike(
      userId,
      silhouetteId,
    );
    if (!existingLike) {
      throw new NotFoundException('좋아요가 존재하지 않습니다.');
    }
    return this.silhouetteLikeRepository.removeLike(userId, silhouetteId);
  }

  // ----- SUB FUNCTION -----

  // 고민하는 방식 이게 소프트딜리트다 보니까 좋아요 취소한 게시글을 다시 좋아요 누른경우를 생각하면 update로 복구해야함
  // create랑 update랑 delete를 한번에 처리하는게 좋을지
  // 아니면 각각의 기능을 나누는게 좋을지

  async toggleLike(
    userId: number,
    silhouetteId: number,
  ): Promise<SilhouetteLike | boolean> {
    await this.silhouetteService.getSilhouetteById(silhouetteId);

    const existingLike = await this.silhouetteLikeRepository.isExistingLike(
      userId,
      silhouetteId,
    );

    if (existingLike) {
      if (existingLike.deletedAt === null) {
        // 이미 좋아요 상태 -> 취소(soft delete)
        await this.silhouetteLikeRepository.removeLike(userId, silhouetteId);
        return false; // 좋아요 취소됨
      } else {
        // soft delete 상태면 복구
        await this.silhouetteLikeRepository.restoreLike(userId, silhouetteId);
        return true; // 좋아요 복구됨
      }
    } else {
      // 기존 좋아요 없으면 새로 생성
      await this.silhouetteLikeRepository.createLike(userId, silhouetteId);
      return true; // 좋아요 생성됨
    }
  }
}
