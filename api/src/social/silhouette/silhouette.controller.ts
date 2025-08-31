import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SilhouetteService } from './silhouette.service';
import { JwtAuthGuard } from 'src/account/auth/jwt';
import { Silhouette, User } from '@prisma/client';
import { CreateSilhouettesDto } from './silhoutette.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('silhouette')
export class SilhouetteController {
  constructor(private readonly silhouetteService: SilhouetteService) {}

  // TODO: CreateSilhouettesDto에 isPublic도 적용
  // TODO: JwtAuthGuard -> OnBoardingGuard
  // TODO: 테스트 - 로그인 안한 경우, 로그인 했지만 온보딩 안한경우, contentUrl이 없을 경우
  // TODO: isPublic만 업데이트하는 api
  // TODO: softDelete
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createSilhouettes(
    @Request() req: { user: User },
    @Body() createSilhouetteDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    return await this.silhouetteService.createSilhouettes(
      req.user.id,
      createSilhouetteDto,
    );
  }
}
