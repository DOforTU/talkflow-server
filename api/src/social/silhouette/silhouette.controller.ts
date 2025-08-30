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
