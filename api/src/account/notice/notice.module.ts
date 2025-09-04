import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';

@Module({
  providers: [NoticeService],
  controllers: [NoticeController],
  exports: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
