import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports';
import type { BannerRepositoryPort } from '../ports';

@Injectable()
export class CreateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
  ) {}

  async execute(params: {
    name?: string | null;
    isActive?: boolean;
    order?: number;
    linkUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    translations: Banner['translations'];
  }): Promise<Banner> {
    const banner: Banner = {
      name: params.name,
      isActive: params.isActive,
      order: params.order,
      linkUrl: params.linkUrl,
      startDate: params.startDate,
      endDate: params.endDate,
      translations: params.translations,
    };

    return this.repository.create(banner);
  }
}
