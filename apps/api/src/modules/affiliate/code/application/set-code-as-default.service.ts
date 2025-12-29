// src/modules/affiliate/code/application/set-code-as-default.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';

interface SetCodeAsDefaultParams {
  id: string;
  userId: bigint;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class SetCodeAsDefaultService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Transactional()
  async execute({
    id,
    userId,
    requestInfo,
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
    const result = updatedCodes.find((c) => c.id === code.id) || code;

    // Activity Log 기록
    if (requestInfo) {
      if (existingDefault && existingDefault.id !== code.id) {
        await this.activityLog.logSuccess(
          {
            userId,
            activityType: ActivityType.AFFILIATE_CODE_SET_DEFAULT,
            description: `기본 어플리에이트 코드 변경 - 이전 코드: ${existingDefault.code}, 새 코드: ${code.code}`,
            metadata: {
              codeId: id,
              code: code.code,
              previousDefaultCodeId: existingDefault.id,
              previousDefaultCode: existingDefault.code,
            },
          },
          requestInfo,
        );
      } else {
        await this.activityLog.logSuccess(
          {
            userId,
            activityType: ActivityType.AFFILIATE_CODE_SET_DEFAULT,
            description: `기본 어플리에이트 코드 설정 - 코드: ${code.code}`,
            metadata: {
              codeId: id,
              code: code.code,
            },
          },
          requestInfo,
        );
      }
    }

    return result;
  }
}
