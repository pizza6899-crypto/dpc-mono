import { Injectable } from '@nestjs/common';
import { CasinoGameCategory as PrismaCategory, CasinoGameCategoryTranslation as PrismaTranslation } from '@repo/database';
import { CasinoGameCategory } from '../domain';

type PrismaCategoryWithTranslations = PrismaCategory & {
    translations: PrismaTranslation[];
};

@Injectable()
export class CategoryMapper {
    toDomain(prismaCategory: PrismaCategoryWithTranslations): CasinoGameCategory {
        return CasinoGameCategory.create({
            id: prismaCategory.id,
            code: prismaCategory.code,
            type: prismaCategory.type,
            iconUrl: prismaCategory.iconUrl,
            bannerUrl: prismaCategory.bannerUrl,
            sortOrder: prismaCategory.sortOrder,
            isActive: prismaCategory.isActive,
            isSystem: prismaCategory.isSystem,
            autoPopulate: prismaCategory.autoPopulate,
            autoRule: prismaCategory.autoRule,
            translations: prismaCategory.translations.map((t) => ({
                language: t.language,
                name: t.name,
                description: t.description,
            })),
        });
    }

    toPrisma(domain: CasinoGameCategory): any {
        return {
            code: domain.code,
            type: domain.type,
            iconUrl: domain.iconUrl,
            bannerUrl: domain.bannerUrl,
            sortOrder: domain.sortOrder,
            isActive: domain.isActive,
            isSystem: domain.isSystem,
            autoPopulate: domain.autoPopulate,
            autoRule: domain.autoRule,
        };
    }

    toPrismaTranslations(domain: CasinoGameCategory): any[] {
        return domain.translations.map((t) => ({
            language: t.language,
            name: t.name,
            description: t.description,
        }));
    }
}
