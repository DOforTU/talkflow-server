import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SilhouetteService } from './silhouette.service';
import { JwtAuthGuard } from 'src/account/auth/jwt';
import { Silhouette, User } from '@prisma/client';
import { CreateSilhouettesDto } from './silhoutette.dto';

@Controller('silhouette')
export class SilhouetteController {
  constructor(private readonly silhouetteService: SilhouetteService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createSilhouettes(
    @Request() req: { user: User },
    @Body() createSilhouettes: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    return await this.silhouetteService.createSilhouettes(
      req.user.id,
      createSilhouettes,
    );
  }
}
