import { Injectable } from '@nestjs/common';
import type {
  Banner as PrismaBanner,
  BannerTranslation as PrismaBannerTranslation,
} from '@prisma/client';
import type { Banner, BannerTranslation } from '../ports';

type PrismaBannerWithTranslations = PrismaBanner & {
  translations: PrismaBannerTranslation[];
};

@Injectable()
export class BannerMapper {
  toDomain(prismaBanner: PrismaBannerWithTranslations): Banner {
    return {
      id: prismaBanner.id,
      name: prismaBanner.name,
      isActive: prismaBanner.isActive,
      order: prismaBanner.order,
      linkUrl: prismaBanner.linkUrl,
      startDate: prismaBanner.startDate,
      endDate: prismaBanner.endDate,
      deletedAt: prismaBanner.deletedAt,
      translations: prismaBanner.translations.map((t) => ({
        id: t.id,
        language: t.language,
        isActive: t.isActive,
        imageUrl: t.imageUrl,
        title: t.title,
        altText: t.altText,
        description: t.description,
        linkUrl: t.linkUrl,
      })),
      createdAt: prismaBanner.createdAt,
      updatedAt: prismaBanner.updatedAt,
    };
  }

  toPrisma(banner: Banner): any {
    return {
      name: banner.name,
      isActive: banner.isActive,
      order: banner.order,
      linkUrl: banner.linkUrl,
      startDate: banner.startDate,
      endDate: banner.endDate,
      deletedAt: banner.deletedAt,
    };
  }

  toPrismaTranslations(banner: Banner): any[] {
    return banner.translations.map((t) => ({
      language: t.language,
      isActive: t.isActive,
      imageUrl: t.imageUrl,
      title: t.title,
      altText: t.altText,
      description: t.description,
      linkUrl: t.linkUrl,
    }));
  }
}
