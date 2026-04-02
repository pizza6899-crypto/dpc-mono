import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY } from '../ports';
import type { BannerRepositoryPort } from '../ports';

@Injectable()
export class DeleteBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute(id: bigint): Promise<void> {
    await this.repository.delete(id);
  }
}
