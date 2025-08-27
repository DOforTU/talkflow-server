import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt';
import { UpdateProfileDto } from './profile.dto';
import { User } from '@prisma/client';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':nickname')
  async getProfileByNickname(@Param('nickname') nickname: string) {
    return await this.profileService.getProfileByNickname(nickname);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: User },
    @Param('id') id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.profileService.updateProfile(
      req.user.id,
      id,
      updateProfileDto,
    );
  }
}
