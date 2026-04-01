import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';

/**
 * [Artifact Draw] 유물 뽑기 요청 영속성 처리를 위한 포트
 */
export abstract class ArtifactDrawRequestRepositoryPort {
  /**
   * 고유 ID로 뽑기 요청 조회
   */
  abstract findById(id: bigint): Promise<ArtifactDrawRequest | null>;

  /**
   * 유저별 결과 산출은 완료되었으나 아직 확인(Claim)하지 않은 내역 조회
   */
  abstract findSettledByUserId(userId: bigint): Promise<ArtifactDrawRequest[]>;

  /**
   * 뽑기 요청 저장 (신규 생성 또는 상태 업데이트)
   */
  abstract save(request: ArtifactDrawRequest): Promise<ArtifactDrawRequest>;
}
