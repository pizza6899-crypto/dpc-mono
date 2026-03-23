import { GamificationConfig } from '../domain/gamification-config.entity';

/**
 * 게이미피케이션 전역 설정 조회를 위한 레포지토리 포트
 */
export interface GamificationConfigRepositoryPort {
  /**
   * 전역 정책 설정 조회
   */
  findConfig(): Promise<GamificationConfig | null>;

  /**
   * 전역 정책 설정 저장 (업데이트)
   */
  saveConfig(config: GamificationConfig): Promise<void>;
}

export const GAMIFICATION_CONFIG_REPOSITORY_PORT = Symbol('GAMIFICATION_CONFIG_REPOSITORY_PORT');
