import { ArtifactGrade } from '@prisma/client';
import { UserArtifactPity } from '../domain/user-artifact-pity.entity';

/**
 * [Artifact Status] 유저 등급별 Pity/통계 저장소 포트
 */
export abstract class UserArtifactPityRepositoryPort {
  /**
   * Pity 기록 생성
   */
  abstract create(pity: UserArtifactPity): Promise<UserArtifactPity>;

  /**
   * 특정 유저의 특정 등급 Pity 정보 조회
   */
  abstract findByUserIdAndGrade(userId: bigint, grade: ArtifactGrade): Promise<UserArtifactPity | null>;

  /**
   * Pity 정보 업데이트
   */
  abstract update(pity: UserArtifactPity): Promise<UserArtifactPity>;

  /**
   * 유저의 모든 등급 Pity 정보 조회
   */
  abstract findAllByUserId(userId: bigint): Promise<UserArtifactPity[]>;

  /**
   * 있으면 업데이트, 없으면 생성 (Upsert)
   */
  abstract upsert(pity: UserArtifactPity): Promise<UserArtifactPity>;
}
