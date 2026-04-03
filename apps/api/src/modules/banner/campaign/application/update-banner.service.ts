import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import { BannerTranslation } from '../domain/banner.entity';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
// file services are used inside BannerTranslationService; not needed directly here
import { BannerTranslationService } from './banner-translation.service';

@Injectable()
export class UpdateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
    private readonly translationService: BannerTranslationService,
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
    translations?: (BannerTranslation & { imageFileId?: bigint })[];
  }): Promise<Banner> {
    const existing = await this.repository.getById(params.id);

    // Always update translations from params when provided.
    const translations = Array.isArray(params.translations) ? params.translations : undefined;

    let resolvedTranslations = undefined as any;
    if (translations) {
      resolvedTranslations = await this.translationService.replaceTranslations({ bannerId: params.id, translations });
    }

    // Use domain entity update method to apply changes
    existing.update({
      name: params.name ?? existing.name,
      isActive: params.isActive ?? existing.isActive,
      order: params.order ?? existing.order,
      linkUrl: params.linkUrl ?? existing.linkUrl,
      startDate: params.startDate ?? existing.startDate,
      endDate: params.endDate ?? existing.endDate,
      deletedAt: params.deletedAt ?? existing.deletedAt,
      translations: resolvedTranslations ?? existing.translations,
    });

    return this.repository.update(existing);
  }
}
