import { GamificationConfig } from '../domain/gamification-config.entity';
import { LevelDefinition } from '../domain/level-definition.entity';
import { ItemCatalog } from '../domain/item-catalog.entity';

/**
 * 게이미피케이션 카탈로그/설정 도메인을 위한 레포지토리 포트
 */
export interface GamificationCatalogRepositoryPort {
  /**
   * 전역 정책 설정 조회
   */
  findConfig(): Promise<GamificationConfig | null>;

  /**
   * 전역 정책 설정 저장 (업데이트)
   */
  saveConfig(config: GamificationConfig): Promise<void>;

  /**
   * 특정 레벨의 정의 조회
   */
  findLevelDefinition(level: number): Promise<LevelDefinition | null>;

  /**
   * 모든 레벨 정의 조회 (컬렉션 순회용)
   */
  findAllLevelDefinitions(): Promise<LevelDefinition[]>;

  /**
   * 아이템 카탈로그 조회 (ID)
   */
  findItemById(id: bigint): Promise<ItemCatalog | null>;

  /**
   * 아이템 카탈로그 조회 (Code)
   */
  findItemByCode(code: string): Promise<ItemCatalog | null>;

  /**
   * 모든 판매 가능 아이템 조회
   */
  findAllItems(): Promise<ItemCatalog[]>;
}

export const GAMIFICATION_CATALOG_REPOSITORY_PORT = Symbol('GAMIFICATION_CATALOG_REPOSITORY_PORT');
