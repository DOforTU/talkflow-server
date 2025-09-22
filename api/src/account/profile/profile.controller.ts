import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt';
import { ResponseProfileDto, UpdateProfileDto } from './profile.dto';
import { Profile, User } from '@prisma/client';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':nickname')
  async getProfileByNickname(
    @Param('nickname') nickname: string,
  ): Promise<ResponseProfileDto> {
    return await this.profileService.getProfileByNickname(nickname);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: User },
    @Param('id') id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.profileService.updateProfile(
      req.user.id,
      id,
      updateProfileDto,
    );
  }

  @Post(':id/reset-avatar')
  @UseGuards(JwtAuthGuard)
  async resetToDefaultAvatar(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<Profile> {
    return await this.profileService.resetToDefaultAvatar(req.user.id, id);
  }
}
