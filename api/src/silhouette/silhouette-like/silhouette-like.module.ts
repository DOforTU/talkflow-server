import { Module } from '@nestjs/common';
import { SilhouetteLikeService } from './silhouette-like.service';
import { SilhouetteLikeController } from './silhouette-like.controller';
import { SilhouetteLikeRepository } from './silhouette-like.repository';
import { SilhouetteModule } from '../silhouette/silhouette.module';

@Module({
  imports: [SilhouetteModule],
  providers: [SilhouetteLikeService, SilhouetteLikeRepository],
  controllers: [SilhouetteLikeController],
  exports: [SilhouetteLikeService, SilhouetteLikeRepository],
})
export class SilhouetteLikeModule {}
