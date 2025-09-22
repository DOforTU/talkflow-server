import { Module } from '@nestjs/common';
import { SilhouetteService } from './silhouette.service';
import { SilhouetteRepository } from './silhouette.repository';
import { SilhouetteController } from './silhouette.controller';
import { ProfileModule } from 'src/account/profile/profile.module';

@Module({
  imports: [ProfileModule],
  controllers: [SilhouetteController],
  providers: [SilhouetteService, SilhouetteRepository],
  exports: [SilhouetteService, SilhouetteRepository], // 다른 모듈에서 이 서비스를 쓰려면 exports에 추가
})
export class SilhouetteModule {}
