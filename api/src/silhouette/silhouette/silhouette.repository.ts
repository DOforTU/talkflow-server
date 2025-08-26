import { Injectable } from '@nestjs/common';
import { Silhouette, User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateSilhouettesDto } from './silhoutette.dto';

@Injectable()
export class SilhouetteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSilhouette(
    userId: number,
    createSilhouettesDto: CreateSilhouettesDto,
  ): Promise<Silhouette> {
    return this.prisma.silhouette.create({
      data: { ...createSilhouettesDto, userId },
    });
  }

  //  async updateMe(id: number, updateUserDto: UpdateUserDto): Promise<User> {
  //    return this.prisma.user.update({
  //      where: { id },
  //      data: { ...updateUserDto },
  //    });
  //  }
}
