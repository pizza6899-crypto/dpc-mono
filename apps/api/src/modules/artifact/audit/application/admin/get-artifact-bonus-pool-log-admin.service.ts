import { Injectable } from '@nestjs/common';
import { ArtifactLogType, Prisma } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { ArtifactBonusPoolLogRepositoryPort } from '../../ports/artifact-bonus-pool-log.repository.port';
import { ArtifactBonusPoolLog } from '../../domain/artifact-bonus-pool-log.entity';

/**
 * [Artifact Audit Admin] 보너스 풀 로그 조회 파라미터
 */
export interface GetArtifactBonusPoolLogAdminParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: Prisma.SortOrder;
  userId?: bigint;
  types?: ArtifactLogType[];
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetArtifactBonusPoolLogAdminService {
  constructor(private readonly repository: ArtifactBonusPoolLogRepositoryPort) { }

  async execute(
    params: GetArtifactBonusPoolLogAdminParams,
  ): Promise<PaginatedData<ArtifactBonusPoolLog>> {
    const { page, limit, sortBy, sortOrder, userId, types, startDate, endDate } = params;

    const skip = (page - 1) * limit;

    const [logs, total] = await this.repository.findAndCount({
      userId,
      types,
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
