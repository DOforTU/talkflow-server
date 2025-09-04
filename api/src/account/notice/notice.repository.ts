import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateNoticeDto } from './notice.dto';

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== CREATE =====
  async create(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    dto: CreateNoticeDto,
  ) {
    return await tx.notice.create({
      data: dto,
    });
  }
}
