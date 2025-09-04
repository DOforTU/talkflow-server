import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './notice.dto';
import { OnBoardingGuard } from 'src/common/guards/onboarding.guard';
import { Notice, User } from '@prisma/client';

@Controller('notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  // ----- CREATE -----

  // ----- READ -----

  // ----- UPDATE -----

  // ----- DELETE -----
}
