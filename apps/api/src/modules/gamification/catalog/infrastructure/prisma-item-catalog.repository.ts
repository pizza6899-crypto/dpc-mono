import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ItemCatalog } from '../domain/item-catalog.entity';
import { ItemCatalogRepositoryPort } from '../ports/item-catalog.repository.port';
import { ItemCatalogMapper } from './item-catalog.mapper';

/**
 * Prisma 기반 아이템 카탈로그 레포지토리
 */
@Injectable()
export class PrismaItemCatalogRepository implements ItemCatalogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  /**
   * 전체 아이템 목록 조회 (번역 포함)
   */
  async findAll(): Promise<ItemCatalog[]> {
    const records = await this.tx.itemCatalog.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((r) => ItemCatalogMapper.toDomain(r));
  }

  /**
   * 특정 ID로 조회
   */
  async findById(id: bigint): Promise<ItemCatalog | null> {
    const record = await this.tx.itemCatalog.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    return record ? ItemCatalogMapper.toDomain(record) : null;
  }

  /**
   * 시스템 코드로 조회
   */
  async findByCode(code: string): Promise<ItemCatalog | null> {
    const record = await this.tx.itemCatalog.findUnique({
      where: { code },
      include: {
        translations: true,
      },
    });

    return record ? ItemCatalogMapper.toDomain(record) : null;
  }

  /**
   * 아이템 저장 (Upsert)
   */
  async save(item: ItemCatalog): Promise<void> {
    const data = ItemCatalogMapper.toPersistence(item);
    
    // 번역 정보 처리 규격
    const translations = item.translations.map((t) => ({
      where: {
        itemId_language: {
          itemId: item.id,
          language: t.language,
        },
      },
      update: {
        name: t.name,
        description: t.description,
      },
      create: {
        language: t.language,
        name: t.name,
        description: t.description,
      },
    }));

    await this.tx.itemCatalog.upsert({
      where: { id: item.id },
      create: {
        ...data,
        translations: {
          create: item.translations.map((t) => ({
            language: t.language,
            name: t.name,
            description: t.description,
          })),
        },
      },
      update: {
        ...data,
        translations: {
          // 💡 복잡한 관계 업데이트는 시나리오에 따라 조절 (여기서는 upsert 지원을 위해 별도 처리 권장)
          // 간단하게 모든 번역을 다시 쓰거나 개별 upsert 사용
          upsert: translations,
        },
      },
    });
  }
}
