import { UserArtifactLog } from '../domain/user-artifact-log.entity';

/**
 * [Audit] 유물 로그 저장소 포트
 */
export abstract class UserArtifactLogRepositoryPort {
  /**
   * 신규 로그 저장
   */
  abstract create(log: UserArtifactLog): Promise<UserArtifactLog>;
}
