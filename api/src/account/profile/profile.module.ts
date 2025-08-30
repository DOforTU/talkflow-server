import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';
import { StorageModule } from '../../common/module/storage/storage.module';

@Module({
  imports: [StorageModule, ConfigModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
