import { ArtifactGrade, ArtifactLogType, Prisma } from '@prisma/client';
import { UserArtifactLog } from '../domain/user-artifact-log.entity';

/**
 * [Audit] 유물 로그 조회 옵션
 */
export interface UserArtifactLogFindOptions {
  userId?: bigint;
  artifactId?: bigint;
  types?: ArtifactLogType[];
  grades?: ArtifactGrade[];
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
  orderBy?: {
    [key: string]: Prisma.SortOrder;
  };
}

/**
 * [Audit] 유물 로그 저장소 포트
 */
export abstract class UserArtifactLogRepositoryPort {
  /**
   * 신규 로그 저장
   */
  abstract create(log: UserArtifactLog): Promise<UserArtifactLog>;

  /**
   * 로그 조회 및 총 개수 반환
   */
  abstract findAndCount(options: UserArtifactLogFindOptions): Promise<[UserArtifactLog[], number]>;
}
