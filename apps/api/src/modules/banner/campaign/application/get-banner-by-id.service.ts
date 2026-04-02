import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports';
import type { BannerRepositoryPort } from '../ports';

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
