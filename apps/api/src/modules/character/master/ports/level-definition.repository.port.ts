import { LevelDefinition } from '../domain/level-definition.entity';

export const LEVEL_DEFINITION_REPOSITORY_PORT = Symbol('LEVEL_DEFINITION_REPOSITORY_PORT');

export interface LevelDefinitionRepositoryPort {
  /**
   * 모든 레벨 정의 목록을 레벨 오름차순으로 조회합니다.
   */
  findAll(): Promise<LevelDefinition[]>;

  /**
   * 특정 레벨의 정의를 조회합니다.
   */
  findByLevel(level: number): Promise<LevelDefinition | null>;

  /**
   * 레벨 정의를 저장합니다 (Upsert).
   */
  save(levelDefinition: LevelDefinition): Promise<void>;

  /**
   * 특정 경험치(XP)에서 도달 가능한 최대 레벨을 찾습니다.
   * (성장 로그 처리 시 사용)
   */
  findLevelByXp(xp: number): Promise<LevelDefinition | null>;
}
