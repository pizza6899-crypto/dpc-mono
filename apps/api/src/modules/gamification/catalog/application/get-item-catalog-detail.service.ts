import { Inject, Injectable } from '@nestjs/common';
import { ITEM_CATALOG_REPOSITORY_PORT, type ItemCatalogRepositoryPort } from '../ports/item-catalog.repository.port';
import { type ItemCatalog } from '../domain/item-catalog.entity';

import { ItemNotFoundException } from '../domain/catalog.exception';

@Injectable()
export class GetItemCatalogDetailService {
  constructor(
    @Inject(ITEM_CATALOG_REPOSITORY_PORT)
    private readonly repository: ItemCatalogRepositoryPort,
  ) { }

  /**
   * 단일 아이템 상세 조회
   * @param id 아이템 ID
   * @returns 아이템 엔티티
   */
  async execute(id: bigint): Promise<ItemCatalog> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new ItemNotFoundException(id);
    }
    return item;
  }
}
