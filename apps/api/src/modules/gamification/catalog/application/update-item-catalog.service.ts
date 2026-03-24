import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, type ItemType, type ExpiryType } from '@prisma/client';

import {
  ITEM_CATALOG_REPOSITORY_PORT,
  type ItemCatalogRepositoryPort
} from '../ports/item-catalog.repository.port';
import { ItemCatalog, type ItemEffect, type ItemTranslation } from '../domain/item-catalog.entity';
import { ItemCodeDuplicatedException, ItemNotFoundException } from '../domain/catalog.exception';

/**
 * 아이템 정보 저장 파라미터 규격
 */
export interface SaveItemCatalogParams {
  id?: bigint; // 기존 아이템 수정 시 필수
  code: string;
  type: ItemType;
  effects: ItemEffect[];
  expiryType: ExpiryType;
  maxUsageCount?: number | null;
  translations: ItemTranslation[];
}

@Injectable()
export class UpdateItemCatalogService {
  constructor(
    @Inject(ITEM_CATALOG_REPOSITORY_PORT)
    private readonly repository: ItemCatalogRepositoryPort,
  ) { }

  /**
   * 아이템 정보를 저장하거나 생성합니다.
   */
  @Transactional()
  async execute(params: SaveItemCatalogParams): Promise<ItemCatalog> {
    let item: ItemCatalog | null = null;

    if (params.id && params.id > 0n) {
      // 1. 기존 아이템 수정
      item = await this.repository.findById(params.id);
      if (!item) {
        throw new ItemNotFoundException();
      }

      // 코드 변경 시 중복 체크
      if (params.code !== item.code) {
        const existing = await this.repository.findByCode(params.code);
        if (existing) {
          throw new ItemCodeDuplicatedException(params.code);
        }
      }

      item.update({
        ...params,
      });
    } else {
      // 2. 신규 아이템 생성
      // 코드 중복 체크 (신규)
      const existing = await this.repository.findByCode(params.code);
      if (existing) {
        throw new ItemCodeDuplicatedException(params.code);
      }

      item = ItemCatalog.create({
        ...params,
      });
    }

    await this.repository.save(item);
    return item;
  }
}
