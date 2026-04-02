import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { Banner } from '../domain/banner.entity';

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
    translations?: Array<any>;
  }): Promise<Banner> {
    const translations = Array.isArray(params.translations)
      ? params.translations
      : [];

    const banner = Banner.create({
      name: params.name ?? null,
      isActive: params.isActive ?? true,
      order: params.order ?? 0,
      linkUrl: params.linkUrl ?? null,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      translations,
      createdAt: null,
      updatedAt: null,
    });

    return this.repository.create(banner);
  }
}
