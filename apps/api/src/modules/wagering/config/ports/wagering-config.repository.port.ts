import type { WageringConfig } from '../domain/wagering-config.entity';

export interface WageringConfigRepositoryPort {
  /**
   * 글로벌 웨이저링 설정을 조회합니다. (ID=1)
   */
  get(): Promise<WageringConfig>;

  /**
   * 설정을 저장(업데이트)합니다.
   */
  save(config: WageringConfig): Promise<WageringConfig>;
}

export const WAGERING_CONFIG_REPOSITORY = Symbol('WAGERING_CONFIG_REPOSITORY');
