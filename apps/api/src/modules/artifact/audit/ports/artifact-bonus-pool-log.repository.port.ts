import { ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';

/**
 * [Audit] 보너스 풀 변동 로그 저장소 포트
 */
export abstract class ArtifactBonusPoolLogRepositoryPort {
  /**
   * 신규 보너스 풀 로그 생성
   */
  abstract create(log: ArtifactBonusPoolLog): Promise<ArtifactBonusPoolLog>;
}
