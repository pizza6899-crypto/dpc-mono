import { Prisma } from '@prisma/client';
import { ItemCatalog, ItemEffect, ItemTranslation } from '../domain/item-catalog.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

/**
 * 아이템 카탈로그 엔티티 매퍼
 */
export class ItemCatalogMapper {
  /**
   * DB 레코드에서 도메인 엔티티로 변환
   */
  static toDomain(record: PersistenceOf<Prisma.ItemCatalogGetPayload<{ include: { translations: true } }>>): ItemCatalog {
    return ItemCatalog.rehydrate({
      id: Cast.bigint(record.id),
      code: record.code,
      type: record.type,
      effects: record.effects as unknown as ItemEffect[],
      price: Cast.decimal(record.price),
      priceCurrency: record.priceCurrency,
      durationDays: record.durationDays,
      createdAt: Cast.date(record.createdAt),
      updatedAt: Cast.date(record.updatedAt),
      translations: (record.translations || []).map((t) => ({
        language: t.language,
        name: t.name,
        description: t.description,
      })),
    });
  }

  /**
   * 도메인 엔티티에서 DB 레코드로 변환 (Update/Create 용)
   */
  static toPersistence(domain: ItemCatalog) {
    return {
      code: domain.code,
      type: domain.type,
      effects: domain.effects as any, // Prisma.Json 지원
      price: domain.price,
      priceCurrency: domain.priceCurrency,
      durationDays: domain.durationDays,
      updatedAt: domain.updatedAt,
    };
  }
}
