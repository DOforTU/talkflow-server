import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SilhouetteService } from './silhouette.service';
import { Silhouette, User } from '@prisma/client';
import { CreateSilhouettesDto } from './silhoutette.dto';
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
