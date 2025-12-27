// src/modules/affiliate/code/application/increment-code-usage.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface IncrementCodeUsageParams {
  code: string;
}

@Injectable()
export class IncrementCodeUsageService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) {}

  async execute({ code }: IncrementCodeUsageParams): Promise<void> {
    // 코드 문자열로 조회 (활성 코드만)
    const affiliateCode = await this.repository.findByCode(code);

    if (!affiliateCode) {
      return; // 코드가 없으면 무시
    }

    // 도메인 엔티티 업데이트
    affiliateCode.markAsUsed();

    // 저장
    await this.repository.update(affiliateCode);
  }
}
