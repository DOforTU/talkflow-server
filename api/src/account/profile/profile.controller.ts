import { Controller, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async getProfile(userId: number) {
    return this.profileService.getProfileByUserId(userId);
  }
}
