import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ArtifactLogType, Prisma } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { UserArtifactLogRepositoryPort } from '../../ports/user-artifact-log.repository.port';
import { UserArtifactLog } from '../../domain/user-artifact-log.entity';

/**
 * [Artifact Audit Admin] 유물 관련 활동 로그 조회 파라미터
 */
export interface GetUserArtifactLogAdminParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: Prisma.SortOrder;
  userId?: bigint;
  artifactId?: bigint;
  types?: ArtifactLogType[];
  grades?: ArtifactGrade[];
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetUserArtifactLogAdminService {
  constructor(private readonly repository: UserArtifactLogRepositoryPort) { }

  async execute(
    params: GetUserArtifactLogAdminParams,
  ): Promise<PaginatedData<UserArtifactLog>> {
    const { page, limit, sortBy, sortOrder, userId, artifactId, types, grades, startDate, endDate } = params;

    const skip = (page - 1) * limit;

    const [logs, total] = await this.repository.findAndCount({
      userId,
      artifactId,
      types,
      grades,
      startDate,
      endDate,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder ?? 'desc' } : undefined,
    });

    return {
      data: logs,
      total,
      page,
      limit,
    };
  }
}
