import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { CreateCodeService } from './create-code.service';
import { Transactional } from '@nestjs-cls/transactional';

interface FindDefaultCodeParams {
  userId: bigint;
}

@Injectable()
export class FindDefaultCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly createCodeService: CreateCodeService,
  ) { }

  @Transactional()
  async execute({
    userId,
  }: FindDefaultCodeParams): Promise<AffiliateCode> {
    // 사용자 기반 락 획득 (동시 요청 시 생성 중복 방지)
    await this.repository.acquireLock(userId);

    const defaultCode = await this.repository.findDefaultByUserId(userId);

    if (defaultCode) {
      return defaultCode;
    }

    // 기본 코드가 없는 경우 새로 생성 (CreateCodeService가 첫 번째 코드를 자동으로 기본으로 설정함)
    return await this.createCodeService.execute({
      userId,
    });
  }
}
