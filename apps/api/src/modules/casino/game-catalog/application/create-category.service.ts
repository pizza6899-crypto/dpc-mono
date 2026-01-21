import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../ports';
import type { CategoryRepositoryPort } from '../ports';
import { CasinoGameCategory, CategoryAlreadyExistsException } from '../domain';
import { CategoryType, Language } from '@prisma/client';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { FileUsageType } from '../../../file/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { EnvService } from 'src/common/env/env.service';

interface CreateCategoryParams {
    code: string;
    type: CategoryType;
    iconFileId?: string;
    bannerFileId?: string;
    sortOrder?: number;
    isActive?: boolean;
    isSystem?: boolean;
    translations: {
        language: Language;
        name: string;
        description?: string;
    }[];
}

@Injectable()
export class CreateCategoryService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly repository: CategoryRepositoryPort,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
    ) { }

    @Transactional()
    async execute(params: CreateCategoryParams): Promise<CasinoGameCategory> {
        const existing = await this.repository.findByCode(params.code);
        if (existing) {
            throw new CategoryAlreadyExistsException(params.code);
        }

        // 1. Create category without URLs first to get ID
        let category = CasinoGameCategory.create({
            ...params,
            iconUrl: null,
            bannerUrl: null,
        });
        category = await this.repository.create(category);

        const categoryId = category.id!;
        let iconUrl: string | null = null;
        let bannerUrl: string | null = null;

        // 2. Attach icon if provided
        if (params.iconFileId) {
            const { files } = await this.attachFileService.execute({
                fileIds: [params.iconFileId],
                usageType: FileUsageType.CASINO_CATEGORY_ICON,
                usageId: categoryId,
            });
            iconUrl = files[0].publicUrl(this.envService.app.cdnUrl);
        }

        // 3. Attach banner if provided
        if (params.bannerFileId) {
            const { files } = await this.attachFileService.execute({
                fileIds: [params.bannerFileId],
                usageType: FileUsageType.CASINO_CATEGORY_BANNER,
                usageId: categoryId,
            });
            bannerUrl = files[0].publicUrl(this.envService.app.cdnUrl);
        }

        // 4. Update category with URLs if attached
        if (iconUrl || bannerUrl) {
            category.update({
                iconUrl: iconUrl ?? category.iconUrl,
                bannerUrl: bannerUrl ?? category.bannerUrl,
            });
            category = await this.repository.update(category);
        }

        return category;
    }
}
