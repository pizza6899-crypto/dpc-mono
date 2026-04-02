import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';

@Injectable()
export class GetBannerByIdService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute(id: bigint): Promise<Banner> {
    return this.repository.getById(id);
  }
}
