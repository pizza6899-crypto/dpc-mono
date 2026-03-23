import { type ItemType } from '@prisma/client';
import { ItemCatalog } from '../domain/item-catalog.entity';

export const ITEM_CATALOG_REPOSITORY_PORT = Symbol('ITEM_CATALOG_REPOSITORY_PORT');

/**
 * 아이템 카탈로그 영속성 제어를 위한 포트
 */
export interface ItemCatalogRepositoryPort {
  /**
   * 페이지네이션된 아이템 목록 조회
   */
  findManyPaginated(params: {
    page: number;
    limit: number;
    type?: ItemType;
    search?: string;
  }): Promise<ItemCatalog[]>;

  /**
   * 조건에 맞는 전체 아이템 건수 조회
   */
  count(params: {
    type?: ItemType;
    search?: string;
  }): Promise<number>;

  /**
   * 전체 아이템 목록 조회 (카탈로그용)
   */
  findAll(): Promise<ItemCatalog[]>;

  /**
   * 특정 ID로 아이템 조회
   */
  findById(id: bigint): Promise<ItemCatalog | null>;

  /**
   * 시스템 코드(Unique)로 아이템 조회
   */
  findByCode(code: string): Promise<ItemCatalog | null>;

  /**
   * 아이템 정보 저장 (Create or Update)
   */
  save(item: ItemCatalog): Promise<void>;
}
