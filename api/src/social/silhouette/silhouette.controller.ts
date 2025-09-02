import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SilhouetteService } from './silhouette.service';
import { Silhouette, User } from '@prisma/client';
import { CreateSilhouettesDto, ResponseSilhouette } from './silhoutette.dto';
import { OnBoardingGuard } from 'src/common/guards/onboarding.guard';

@Controller('silhouette')
export class SilhouetteController {
  constructor(private readonly silhouetteService: SilhouetteService) {}

  // TODO: CreateSilhouettesDto에 isPublic도 적용
  // TODO: JwtAuthGuard -> OnBoardingGuard
  // TODO: 테스트 - 로그인 안한 경우, 로그인 했지만 온보딩 안한경우, contentUrl이 없을 경우
  // TODO: isPublic만 업데이트하는 api
  // TODO: softDelete
  @Post('create')
  @UseGuards(OnBoardingGuard)
  async createSilhouettes(
    @Request() req: { user: User },
    @Body() createSilhouetteDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    return await this.silhouetteService.createSilhouettes(
      req.user.id,
      createSilhouetteDto,
    );
  }

  // ----- READ -----

  /**
   *
   * @param limit 한번에 게시글을 몇개 불러오고 보여줄것인지 20개가 최대 스크롤하여 20개 요청한거 보여주고 20번째 다시 20개 호출
   * @param offset 값이 0이기에 건너뜀없이 하나씩 차례대로 보여줌
   * @returns 최근 silhouette 20개를 최신순으로 보여줌
   */
  @Get()
  async findPublicSilhouettesOrderByLatest(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ResponseSilhouette[]> {
    return await this.silhouetteService.findPublicSilhouettesOrderByLatest(
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  /**
   * 좋아요가 많은 순으로 인기순 silhouette을 보여줄 예정
   * @param limit
   * @param offset
   * @returns
   */
  async findPublicSilhouettesOrderByLike(
    limit?: number,
    offset?: number,
  ): Promise<ResponseSilhouette[]> {
    return await this.silhouetteService.findPublicSilhouettesOrderByLike(
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }
  // ----- UPDATE -----

  @Patch('update/:id')
  @UseGuards(OnBoardingGuard)
  async updateIsPublic(
    @Param('id') id: number,
    @Request() req: { user: User },
    @Body('isPublic') isPublic: boolean,
  ): Promise<Silhouette> {
    return await this.silhouetteService.updateIsPublic(
      id,
      req.user.id,
      isPublic,
    );
  }

  // ----- DELETE -----
  /**
   * @param req
   * @param updateSilhouetteDto
   * @returns
   * 삭제하기 위함 soft delete
   */
  @Patch('update/:id')
  @UseGuards(OnBoardingGuard)
  async deleteSilhouettes(@Request() req: { user: User }): Promise<Silhouette> {
    return await this.silhouetteService.deleteSilhouettes(req.user.id);
  }
}
