import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':nickname')
  async getProfileByNickname(@Param('nickname') nickname: string) {
    return await this.profileService.getProfileByNickname(nickname);
  }
}
