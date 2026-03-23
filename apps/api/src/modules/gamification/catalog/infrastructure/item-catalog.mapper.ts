import { Injectable } from '@nestjs/common';
import {
  ItemCatalog as PrismaItemCatalog,
  ItemTranslation as PrismaItemTranslation,
} from '@prisma/client';
import { ItemCatalog, ItemTranslation } from '../domain/item-catalog.entity';

@Injectable()
export class ItemCatalogMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(
    prismaItem: PrismaItemCatalog & { translations?: PrismaItemTranslation[] },
  ): ItemCatalog {
    const translations: ItemTranslation[] = (prismaItem.translations || []).map((t) => ({
      language: t.language,
      name: t.name,
      description: t.description,
    }));

    return ItemCatalog.rehydrate({
      id: prismaItem.id,
      code: prismaItem.code,
      type: prismaItem.type,
      effects: prismaItem.effects,
      price: prismaItem.price,
      priceCurrency: prismaItem.priceCurrency,
      durationDays: prismaItem.durationDays,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
      translations,
    });
  }
}
