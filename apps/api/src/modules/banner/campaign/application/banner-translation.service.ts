import { Inject, Injectable, Logger } from '@nestjs/common';
import { BANNER_REPOSITORY, type Banner } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { BannerTranslation } from '../domain/banner.entity';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';
import { BannerInvalidImageFileIdException } from '../domain/banner.errors';

@Injectable()
export class BannerTranslationService {
  private readonly logger = new Logger(BannerTranslationService.name);
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
    private readonly fileUrlService: FileUrlService,
    private readonly attachFileService: AttachFileService,
  ) {}

  /**
   * Resolve translations: attach files, fetch URLs and return updated translations.
   * This method does NOT persist changes. Caller must persist in a single repository.update().
   */
  async replaceTranslations(params: { bannerId: bigint; translations?: (BannerTranslation & { imageFileId?: string | bigint | null })[] }): Promise<BannerTranslation[]> {
    const translationsParam = params.translations ?? [];

    const toBigIntSafe = (v: string | bigint | null | undefined): bigint | null => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'bigint') return v;
      try {
        return BigInt(String(v));
      } catch (e) {
        throw new BannerInvalidImageFileIdException();
      }
    };

    // collect unique fileIds (may be empty)
    const fileIdSet = new Set<string>();
    const fileIds: bigint[] = [];
    for (const t of translationsParam) {
      const maybe = toBigIntSafe((t as any).imageFileId);
      if (maybe !== null) {
        const key = String(maybe);
        if (!fileIdSet.has(key)) {
          fileIdSet.add(key);
          fileIds.push(maybe);
        }
      }
    }

    let urlsMap = new Map<string, string | null>();

    if (fileIds.length > 0) {
      await this.attachFileService.execute({
        fileIds,
        usageType: FileUsageType.BANNER_IMAGE,
        usageId: params.bannerId,
      });

      urlsMap = await this.fileUrlService.getUrlsByFileIds(fileIds);
    }

    const updatedTranslations = translationsParam.map((t) => {
      const fileId = toBigIntSafe((t as any).imageFileId);
      return {
        ...t,
        imageUrl: fileId ? urlsMap.get(String(fileId)) ?? null : null,
      } as BannerTranslation;
    });

    this.logger.log(`Resolved ${updatedTranslations.length} translations for banner ${String(params.bannerId)}`);
    return updatedTranslations;
  }
}
