import { Module } from '@nestjs/common';
import { SilhouetteLikeService } from './silhouette-like.service';
import { SilhouetteLikeController } from './silhouette-like.controller';
import { SilhouetteLikeRepository } from './silhouette-like.repository';
import { SilhouetteModule } from '../silhouette/silhouette.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from 'src/common/module/storage/storage.module';
import { ProfileModule } from 'src/account/profile/profile.module';

@Module({
  imports: [StorageModule, ConfigModule, SilhouetteModule, ProfileModule],
  providers: [SilhouetteLikeService, SilhouetteLikeRepository],
  controllers: [SilhouetteLikeController],
  exports: [SilhouetteLikeService, SilhouetteLikeRepository],
})
export class SilhouetteLikeModule {}
