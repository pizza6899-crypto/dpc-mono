import { LevelDefinition } from '../domain/level-definition.entity';

/**
 * 게이미피케이션 레벨 정의 마스터 데이터를 위한 레포지토리 포트
 */
export interface LevelDefinitionRepositoryPort {
  /**
   * 특정 레벨의 정의 조회
   */
  findLevelDefinition(level: number): Promise<LevelDefinition | null>;

  /**
   * 모든 레벨 정의 조회 (컬렉션 순회용)
   */
  findAllLevelDefinitions(): Promise<LevelDefinition[]>;
}

export const LEVEL_DEFINITION_REPOSITORY_PORT = Symbol('LEVEL_DEFINITION_REPOSITORY_PORT');
