import { ArtifactLogType, Prisma } from '@prisma/client';
import { ArtifactBonusPoolLog } from '../domain/artifact-bonus-pool-log.entity';

/**
 * [Audit] 보너스 풀 로그 조회 옵션
 */
export interface ArtifactBonusPoolLogFindOptions {
  userId?: bigint;
  types?: ArtifactLogType[];
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
  orderBy?: {
    [key: string]: Prisma.SortOrder;
  };
}

/**
 * [Audit] 보너스 풀 변동 로그 저장소 포트
 */
export abstract class ArtifactBonusPoolLogRepositoryPort {
  /**
   * 신규 보너스 풀 로그 생성
   */
  abstract create(log: ArtifactBonusPoolLog): Promise<ArtifactBonusPoolLog>;

  /**
   * 보너스 풀 로그 조회 및 총 개수 반환
   */
  abstract findAndCount(options: ArtifactBonusPoolLogFindOptions): Promise<[ArtifactBonusPoolLog[], number]>;
}
