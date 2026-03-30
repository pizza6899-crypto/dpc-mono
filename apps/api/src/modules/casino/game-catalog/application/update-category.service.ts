import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import { CasinoGameCategory } from '../domain';
import { Language } from '@prisma/client';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { EnvService } from 'src/infrastructure/env/env.service';

interface UpdateCategoryParams {
  id: bigint;
  iconFileId?: string | null;
  bannerFileId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  translations?: {
    language: Language;
    name: string;
    description?: string | null;
  }[];
}

@Injectable()
export class UpdateCategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepositoryPort,
    private readonly attachFileService: AttachFileService,
    private readonly envService: EnvService,
  ) {}

  @Transactional()
  async execute(params: UpdateCategoryParams): Promise<CasinoGameCategory> {
    const category = await this.repository.getById(params.id);

    let iconUrl = category.iconUrl;
    let bannerUrl = category.bannerUrl;

    // 1. Attach icon if provided
    if (params.iconFileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [params.iconFileId],
        usageType: FileUsageType.CASINO_CATEGORY_ICON,
        usageId: category.id!,
      });
      iconUrl = files[0].publicUrl(this.envService.app.cdnUrl);
    } else if (params.iconFileId === null) {
      iconUrl = null;
    }

    // 2. Attach banner if provided
    if (params.bannerFileId) {
      const { files } = await this.attachFileService.execute({
        fileIds: [params.bannerFileId],
        usageType: FileUsageType.CASINO_CATEGORY_BANNER,
        usageId: category.id!,
      });
      bannerUrl = files[0].publicUrl(this.envService.app.cdnUrl);
    } else if (params.bannerFileId === null) {
      bannerUrl = null;
    }

    category.update({
      iconUrl,
      bannerUrl,
      sortOrder: params.sortOrder,
      isActive: params.isActive,
      translations: params.translations,
    });

    return await this.repository.update(category);
  }
}
