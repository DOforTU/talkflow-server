import {
  Controller,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SilhouetteLikeService } from './silhouette-like.service';
import { JwtAuthGuard } from 'src/account/auth/jwt';
import { SilhouetteLike, User } from '@prisma/client';

@Controller('silhouette-like')
export class SilhouetteLikeController {
  constructor(private readonly silhouetteLikeService: SilhouetteLikeService) {}

  /**
   *
   * @param req 사용자 정보
   * @param id 실루엣 ID
   * @returns 실루엣 좋아요 생성
   * post 인자를 silhouetteId로 받을지 id로 할지
   */
  @Post(':id')
  @UseGuards(JwtAuthGuard)
  async createLike(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<SilhouetteLike> {
    console.log('SilhouetteLikeController - createLike');
    return await this.silhouetteLikeService.createLike(req.user.id, id);
  }

  //@Patch('restore/:id')
  //@UseGuards(JwtAuthGuard)
  //async restoreLike(
  //  @Request() req: { user: User },
  //  @Param('id') id: number,
  //): Promise<SilhouetteLike | null> {
  //  return await this.silhouetteLikeService.restoreLike(req.user.id, id);
  //}

  /**
   *
   * @param req 사용자 정보
   * @param id  실루엣 ID
   * @returns 실루엣 좋아요 취소
   * patch 인자를 silhouetteId로 받을지 id로 할지
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async removeLike(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<SilhouetteLike | boolean> {
    return await this.silhouetteLikeService.removeLike(req.user.id, id);
  }
}
