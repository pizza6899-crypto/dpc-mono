import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodePolicy } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { CreateCodeService } from './create-code.service';
import { Transactional } from '@nestjs-cls/transactional';

interface FindCodesParams {
  userId: bigint;
}

@Injectable()
export class FindCodesService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly createCodeService: CreateCodeService,
    private readonly policy: AffiliateCodePolicy,
  ) { }

  @Transactional()
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
    // 1. 사용자 기반 락 획득 (동시 요청 시 생성 중복 방지)
    // 페이지가 1페이지일 때만 락을 걸고 생성 체크를 하는 것이 효율적일 수 있으나,
    // total count 조회 시에도 코드가 없으면 0이 나오므로
    // "최초 진입" 여부를 판단하기 위해 일단 락을 획득하여 안전하게 처리
    await this.repository.acquireLock(userId);

    // 2. 전체 개수 먼저 조회
    const total = await this.repository.countByUserId(userId);

    // 3. 코드가 하나도 없는 경우 (첫 진입) 새로 생성
    if (total === 0) {
      await this.createCodeService.execute({ userId });
    }

    // 4. 다시 조회 (페이징 적용)
    // 막 생성된 경우 total=1, page=1 이므로 조회가 됨
    // 기존 데이터가 있는 경우 요청된 페이지 조회
    const codes = await this.repository.findByUserId(userId, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // 새로 생성된 경우 total 업데이트
    const finalTotal = total === 0 ? 1 : total;

    return {
      codes,
      total: finalTotal,
      limit,
      page,
    };
  }
}
