// src/modules/affiliate/code/application/create-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  AffiliateCode,
  AffiliateCodePolicy,
  AffiliateCodeAlreadyExistsException,
  AffiliateCodeValue,
} from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ActivityType } from 'src/common/activity-log/activity-log.types';

interface CreateCodeParams {
  userId: bigint;
  campaignName?: string;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class CreateCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly policy: AffiliateCodePolicy,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Transactional()
  async execute({
    userId,
    campaignName,
    requestInfo,
  }: CreateCodeParams): Promise<AffiliateCode> {
    // 사용자별 기존 코드 조회 (개수 제한 및 첫 번째 코드 확인용)
    const existingCodes = await this.repository.findByUserId(userId);

    // 정책 검증 (개수 제한)
    this.policy.canCreateCode(existingCodes.length);

    // 첫 번째 코드인지 확인
    const isFirstCode = this.policy.isFirstCode(existingCodes.length);

    // 고유한 코드 자동 생성 (중복 체크 포함)
    const code = await this.generateUniqueCode();

    // Repository에서 ID 생성 및 저장
    const createdCode = await this.repository.create({
      userId,
      code,
      campaignName,
      isDefault: isFirstCode, // 첫 번째 코드는 기본 코드로 설정
    });

    // Activity Log 기록
    if (requestInfo) {
      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.AFFILIATE_CODE_CREATE,
          description: `어플리에이트 코드 생성 완료 - 코드: ${code}, 캠페인명: ${campaignName || '없음'}, 기본코드: ${isFirstCode}`,
          metadata: {
            codeId: createdCode.id,
            code,
            campaignName: campaignName || null,
            isDefault: isFirstCode,
          },
        },
        requestInfo,
      );
    }

    return createdCode;
  }

  /**
   * 고유한 코드 자동 생성 (중복 체크 포함)
   * 최대 10번 재시도
   */
  private async generateUniqueCode(): Promise<string> {
    const MAX_RETRIES = 10;
    const CODE_LENGTH = 8;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const codeValue = AffiliateCodeValue.generate(CODE_LENGTH);
      const code = codeValue.value;

      // 전체 시스템에서 코드 중복 체크
      const codeExists = await this.repository.existsByCode(code);
      if (!codeExists) {
        return code;
      }
    }

    throw new AffiliateCodeAlreadyExistsException(
      'Failed to generate unique code after multiple attempts',
    );
  }
}
