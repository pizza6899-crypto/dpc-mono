import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';

@Injectable()
export class UpdateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute(params: {
    id: bigint;
    name?: string | null;
    isActive?: boolean;
    order?: number;
    linkUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    deletedAt?: Date | null;
    translations?: Banner['translations'];
  }): Promise<Banner> {
    const existing = await this.repository.getById(params.id);
    // Use domain entity update method to apply changes
    existing.update({
      name: params.name ?? existing.name,
      isActive: params.isActive ?? existing.isActive,
      order: params.order ?? existing.order,
      linkUrl: params.linkUrl ?? existing.linkUrl,
      startDate: params.startDate ?? existing.startDate,
      endDate: params.endDate ?? existing.endDate,
      deletedAt: params.deletedAt ?? existing.deletedAt,
      translations: params.translations ?? existing.translations,
    });

    return this.repository.update(existing);
  }
}
