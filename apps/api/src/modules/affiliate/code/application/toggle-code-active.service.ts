// src/modules/affiliate/code/application/toggle-code-active.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface ToggleCodeActiveParams {
  id: string;
  userId: bigint;
}

@Injectable()
export class ToggleCodeActiveService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }

  async execute({
    id,
    userId,
  }: ToggleCodeActiveParams): Promise<AffiliateCode> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 도메인 엔티티 업데이트
    code.toggleActive();

    // 저장
    return await this.repository.update(code);
  }
}
