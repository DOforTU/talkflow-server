import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { FollowRepository } from './follow.repository';
import { ProfileModule } from 'src/account/profile/profile.module';

@Module({
  imports: [ProfileModule],
  providers: [FollowService, FollowRepository],
  controllers: [FollowController],
  exports: [FollowService, FollowRepository],
})
export class FollowModule {}
