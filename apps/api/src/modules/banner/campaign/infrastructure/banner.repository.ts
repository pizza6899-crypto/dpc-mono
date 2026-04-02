import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { BANNER_REPOSITORY, BannerRepositoryPort } from '../ports';

/**
 * Banner Repository - 배너 데이터 접근 계층
 */
@Injectable()
export class BannerRepository implements BannerRepositoryPort {
  constructor(private prisma: PrismaService) {}

  // TODO: implement repository methods
}
