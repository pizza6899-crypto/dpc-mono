import { UserArtifact } from '../domain/user-artifact.entity';

/**
 * [Artifact] 유저 보유 유물(Inventory) 저장소 포트
 */
export abstract class UserArtifactRepositoryPort {
  /**
   * 유저의 보유 유물 전체 조회
   */
  abstract findByUserId(userId: bigint): Promise<UserArtifact[]>;

  /**
   * 단일 보유 유물 조회
   */
  abstract findById(id: bigint): Promise<UserArtifact | null>;

  /**
   * 신규 유물 생성
   */
  abstract save(entity: UserArtifact): Promise<UserArtifact>;

  /**
   * 대량의 신규 유물 생성 (Gacha 10연차 등)
   */
  abstract saveAll(entities: UserArtifact[]): Promise<UserArtifact[]>;

  /**
   * 유물 정보 업데이트 (장착/해제 등)
   */
  abstract update(entity: UserArtifact): Promise<UserArtifact>;
}
