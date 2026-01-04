import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface FindCodesParams {
  userId: bigint;
}

@Injectable()
export class FindCodesService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }


  async execute({
    userId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: FindCodesParams & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    codes: AffiliateCode[];
    total: number;
    limit: number;
    page: number;
  }> {
    // 1. 전체 개수 조회
    const total = await this.repository.countByUserId(userId);

    // 2. 조회 (페이징 적용)
    const codes = await this.repository.findByUserId(userId, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return {
      codes,
      total,
      limit,
      page,
    };
  }
}
