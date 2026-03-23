import { ItemCatalog } from '../domain/item-catalog.entity';

/**
 * 게이미피케이션 아이템 카탈로그(상점)를 위한 레포지토리 포트
 */
export interface ItemCatalogRepositoryPort {
  /**
   * 아이템 카탈로그 조회 (ID)
   */
  findById(id: bigint): Promise<ItemCatalog | null>;

  /**
   * 아이템 카탈로그 조회 (Code)
   */
  findByCode(code: string): Promise<ItemCatalog | null>;

  /**
   * 모든 판매 가능 아이템 조회
   */
  findAllItems(): Promise<ItemCatalog[]>;
}

export const ITEM_CATALOG_REPOSITORY_PORT = Symbol('ITEM_CATALOG_REPOSITORY_PORT');
