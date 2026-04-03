import { Injectable } from '@nestjs/common';
import type {
  Banner as PrismaBanner,
  BannerTranslation as PrismaBannerTranslation,
} from '@prisma/client';
import type { BannerTranslation } from '../domain/banner.entity';
import { Banner } from '../domain/banner.entity';

type PrismaBannerWithTranslations = PrismaBanner & {
  translations: PrismaBannerTranslation[];
};

@Injectable()
export class BannerMapper {
  toDomain(prismaBanner: PrismaBannerWithTranslations): Banner {
    const translations: BannerTranslation[] = prismaBanner.translations.map((t) => ({
      id: t.id,
      language: t.language,
      isActive: t.isActive,
      imageUrl: t.imageUrl,
      title: t.title,
      altText: t.altText,
      linkUrl: t.linkUrl,
    }));

    return Banner.create({
      id: prismaBanner.id,
      name: prismaBanner.name ?? null,
      isActive: prismaBanner.isActive,
      order: prismaBanner.order,
      linkUrl: prismaBanner.linkUrl ?? null,
      startDate: prismaBanner.startDate ?? null,
      endDate: prismaBanner.endDate ?? null,
      deletedAt: prismaBanner.deletedAt ?? null,
      translations,
      createdAt: prismaBanner.createdAt ?? null,
      updatedAt: prismaBanner.updatedAt ?? null,
    });
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
      linkUrl: t.linkUrl,
    }));
  }
}
