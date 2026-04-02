import { Inject, Injectable } from '@nestjs/common';
import { BannerInvalidImageFileIdException } from '../domain/banner.errors';
import { BANNER_REPOSITORY } from '../ports/banner.repository.port';
import type { BannerRepositoryPort } from '../ports/banner.repository.port';
import { Banner, BannerTranslation } from '../domain/banner.entity';
import { FileUrlService } from 'src/modules/file/application/file-url.service';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUsageType } from 'src/modules/file/domain/model/file-usage.type';

@Injectable()
export class CreateBannerService {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly repository: BannerRepositoryPort,
    private readonly fileUrlService: FileUrlService,
    private readonly attachFileService: AttachFileService,
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

    // If created, always update translations from params.
    // When imageFileId exists, attach files and resolve URLs; otherwise imageUrl stays null.
    if (created.id) {
      const translationsParam = params.translations ?? [];

      // collect fileIds (may be empty)
      const fileIds = translationsParam
        .map((t) => (t && (t as any).imageFileId ? (t as any).imageFileId : null))
        .filter(Boolean) as bigint[];

      // validate file ids are bigints if provided
      const invalidId = fileIds.some((id) => typeof id !== 'bigint');
      if (invalidId) {
        throw new BannerInvalidImageFileIdException();
      }

      let urlsMap = new Map<string, string | null>();

      if (fileIds.length > 0) {
        await this.attachFileService.execute({
          fileIds,
          usageType: FileUsageType.BANNER_IMAGE,
          usageId: created.id,
        });

        urlsMap = await this.fileUrlService.getUrlsByFileIds(fileIds);
      }

      // Map fileId -> url (or null)
      const updatedTranslations = translationsParam.map((t) => {
        const fileId = (t as any).imageFileId ?? null;
        return {
          ...t,
          imageUrl: fileId ? urlsMap.get(String(fileId)) ?? null : null,
        };
      });

      // apply updates to created entity and persist
      created.update({ translations: updatedTranslations as any });
      await this.repository.update(created);
    }

    return created;
  }
}
