// src/modules/affiliate/code/application/set-code-as-default.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { Transactional } from '@nestjs-cls/transactional';

interface SetCodeAsDefaultParams {
  id: string;
  userId: bigint;
}

@Injectable()
export class SetCodeAsDefaultService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }

  @Transactional()
  async execute({
    id,
    userId,
  }: SetCodeAsDefaultParams): Promise<AffiliateCode> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 기존 기본 코드 조회
    const existingDefault = await this.repository.findDefaultByUserId(userId);

    // 업데이트할 코드 목록 준비
    const updates: Array<{ code: AffiliateCode }> = [];

    // 새 기본 코드 설정
    code.setAsDefault();
    updates.push({ code });

    // 기존 기본 코드가 있고 다른 코드인 경우 해제
    if (existingDefault && existingDefault.id !== code.id) {
      existingDefault.unsetAsDefault();
      updates.push({ code: existingDefault });
    }

    // 트랜잭션 내에서 여러 코드 업데이트
    const updatedCodes = await this.repository.updateMany(updates);

    // 새로 설정된 기본 코드 반환
    return updatedCodes.find((c) => c.id === code.id) || code;
  }
}
