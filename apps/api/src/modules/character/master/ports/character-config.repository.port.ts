import { CharacterConfig } from '../domain/character-config.entity';

/**
 * 게이미피케이션 전역 설정 조회를 위한 레포지토리 포트
 */
export interface CharacterConfigRepositoryPort {
  /**
   * 전역 정책 설정 조회
   */
  findConfig(): Promise<CharacterConfig | null>;

  /**
   * 전역 정책 설정 저장 (업데이트)
   */
  saveConfig(config: CharacterConfig): Promise<void>;
}

export const CHARACTER_CONFIG_REPOSITORY_PORT = Symbol('CHARACTER_CONFIG_REPOSITORY_PORT');
