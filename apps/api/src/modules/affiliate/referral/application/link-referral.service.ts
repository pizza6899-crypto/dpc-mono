// src/modules/affiliate/referral/application/link-referral.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Referral, ReferralPolicy } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { FindCodeByCodeService } from '../../code/application/find-code-by-code.service';
import {
  DuplicateReferralException,
  ReferralCodeNotFoundException,
} from '../domain/referral.exception';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface LinkReferralParams {
  subUserId: bigint; // 피추천인 (가입하는 사용자)
  referralCode: string; // 레퍼럴 코드 문자열
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
  userAgent?: string | null;
  requestInfo?: RequestClientInfo; // Activity Log용
}

@Injectable()
export class LinkReferralService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
    private readonly findCodeByCodeService: FindCodeByCodeService,
    private readonly policy: ReferralPolicy,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  @Transactional()
  async execute({
    subUserId,
    referralCode,
    ipAddress,
    deviceFingerprint,
    userAgent,
    requestInfo,
  }: LinkReferralParams): Promise<Referral> {
    // 1. 레퍼럴 코드 조회
    const code = await this.findCodeByCodeService.execute({
      code: referralCode,
    });
    if (!code) {
      throw new ReferralCodeNotFoundException(referralCode);
    }

    // 2. 정책 검증 (셀프 추천 방지, 코드 활성화, 만료 확인)
    this.policy.canCreateReferral(code.userId, subUserId, code);

    // 3. 중복 레퍼럴 관계 확인 (이미 다른 코드로 가입한 경우)
    const existingReferral = await this.repository.findBySubUserId(subUserId);
    if (existingReferral) {
      throw new DuplicateReferralException();
    }

    // 4. 레퍼럴 관계 생성
    const referral = await this.repository.create({
      affiliateId: code.userId,
      codeId: code.id,
      subUserId,
      ipAddress,
      deviceFingerprint,
      userAgent,
    });

    // 5. Audit Log 기록 (피추천인 관점에서 기록)
    if (requestInfo) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: subUserId.toString(),
            category: 'AFFILIATE',
            action: 'REFERRAL_LINKED',
            metadata: {
              referralId: referral.id,
              affiliateId: code.userId.toString(),
              referralCode: referralCode,
              codeId: code.id,
              codeCampaignName: code.campaignName || null,
            },
          },
        },
        requestInfo,
      );
    }

    return referral;
  }
}
