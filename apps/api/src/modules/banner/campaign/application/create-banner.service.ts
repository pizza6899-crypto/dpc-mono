import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { Banner, BannerTranslation } from '../domain/banner.entity';
import { BannerTranslationService } from './banner-translation.service';

@Injectable()
export class CreateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
    private readonly translationService: BannerTranslationService,
  ) {}

  async execute(params: {
    name?: string | null;
    isActive?: boolean;
    order?: number;
    linkUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    translations?: (BannerTranslation & { imageFileId?: bigint })[];
  }): Promise<Banner> {

    const banner = Banner.create({
      name: params.name ?? null,
      isActive: params.isActive ?? true,
      order: params.order ?? 0,
      linkUrl: params.linkUrl ?? null,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      translations: [],
      createdAt: null,
      updatedAt: null,
    });

    const created = await this.repository.create(banner);

    // If created, resolve translations (attach + URL resolution) and persist once.
    if (created.id) {
      const resolvedTranslations = await this.translationService.replaceTranslations({ bannerId: created.id, translations: params.translations });
      created.update({ translations: resolvedTranslations });
      const persisted = await this.repository.update(created);
      return persisted;
    }

    return created;
  }
}
