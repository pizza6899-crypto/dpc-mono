import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

/**
 * [Artifact Status] 유저 유물 상태 저장소 포트
 */
export abstract class UserArtifactStatusRepositoryPort {
  /**
   * 상태 생성 (최초 가입/시스템 진입 시)
   */
  abstract create(status: UserArtifactStatus): Promise<UserArtifactStatus>;

  /**
   * 유저 ID로 상태 조회
   */
  abstract findByUserId(userId: bigint): Promise<UserArtifactStatus | null>;

  /**
   * 상태 업데이트 (횟수 증가, 슬롯 해금 등)
   */
  abstract update(status: UserArtifactStatus): Promise<UserArtifactStatus>;

  /**
   * 있으면 업데이트, 없으면 생성 (Upsert)
   */
  abstract upsert(status: UserArtifactStatus): Promise<UserArtifactStatus>;
}
