import { Inject, Injectable } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import { BannerTranslation } from '../domain/banner.entity';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';

@Injectable()
export class UpdateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
    private readonly fileUrlService: FileUrlService,
    private readonly attachFileService: AttachFileService,
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

    let mappedTranslations = translations ?? undefined;

    if (translations) {
      const fileIdStrings = Array.from(
        new Set(
          translations
            .map((t) => (t && (t as any).imageFileId ? String((t as any).imageFileId) : null))
            .filter(Boolean) as string[],
        ),
      );

      const fileIds = fileIdStrings.length ? fileIdStrings.map((s) => BigInt(s)) : [];

      // validate file ids are bigints
      const invalidId = fileIds.some((id) => typeof id !== 'bigint');
      if (invalidId) {
        throw new Error('Invalid imageFileId type');
      }

      if (fileIds.length > 0) {
        await this.attachFileService.execute({
          fileIds,
          usageType: FileUsageType.BANNER_IMAGE,
          usageId: params.id,
        });
      }

      const urlsMap = fileIds.length ? await this.fileUrlService.getUrlsByFileIds(fileIds) : new Map<string, string | null>();

      mappedTranslations = translations.map((t) => ({
        ...t,
        imageUrl: (t as any).imageFileId ? urlsMap.get(String((t as any).imageFileId)) ?? null : null,
      }));
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
      translations: mappedTranslations ?? existing.translations,
    });

    return this.repository.update(existing);
  }
}
