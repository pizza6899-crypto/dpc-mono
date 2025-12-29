// src/modules/affiliate/commission/application/set-custom-rate.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import {
  AffiliateTier,
  CommissionPolicy,
  CommissionException,
} from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { IdUtil } from 'src/utils/id.util';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';

interface SetCustomRateParams {
  affiliateId: bigint;
  customRate: Prisma.Decimal;
  setBy: bigint; // 관리자 ID
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class SetCustomRateService {
  private readonly logger = new Logger(SetCustomRateService.name);

  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
    private readonly policy: CommissionPolicy,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Transactional()
  async execute({
    affiliateId,
    customRate,
    setBy,
    requestInfo,
  }: SetCustomRateParams): Promise<AffiliateTier> {
    try {
      // 요율 유효성 검증 (Policy에서 먼저 검증)
      // tier.setCustomRate() 내부에서도 검증하지만, Policy에서 먼저 검증하여
      // 명확한 에러 메시지를 제공
      this.policy.validateRate(customRate);

      // 티어 조회 (없으면 기본 티어로 생성)
      let tier = await this.repository.findByAffiliateId(affiliateId);

      // 변경 전 상태 저장 (로그용)
      const previousCustomRate = tier?.customRate;
      const wasCustomRate = tier?.isCustomRate ?? false;

      if (!tier) {
        // 기본 티어(BRONZE)로 생성
        const baseRate = this.policy.getBaseRateForTier(
          AffiliateTierLevel.BRONZE,
        );
        tier = AffiliateTier.create({
          uid: IdUtil.generateUid(),
          affiliateId,
          tier: AffiliateTierLevel.BRONZE,
          baseRate,
        });
        tier = await this.repository.upsert(tier);
      }

      // 수동 요율 설정 (엔티티 상태 변경)
      tier.setCustomRate(customRate, setBy);

      // 엔티티를 변경한 후 Repository에 저장
      // repository.setCustomRate()는 직접 DB 업데이트하지만,
      // 엔티티를 변경한 후 upsert()를 사용하는 것이 더 일관성 있는 패턴
      const updatedTier = await this.repository.upsert(tier);

      // Activity Log 기록 (성공)
      if (requestInfo) {
        await this.activityLog.logSuccess(
          {
            userId: setBy, // 관리자 ID (액션을 수행한 사용자)
            isAdmin: true,
            activityType: ActivityType.COMMISSION_RATE_SET,
            description: `커미션 수동 요율 설정 완료 - 요율: ${customRate.toString()} (${customRate.mul(10000).toFixed(0)}), 설정자: ${setBy}`,
            metadata: {
              affiliateId, // 대상 어필리에이트 유저 ID
              customRate: customRate.toString(),
              previousCustomRate: previousCustomRate?.toString() || null,
              wasCustomRate,
              tier: updatedTier.tier,
              baseRate: updatedTier.baseRate.toString(),
            },
          },
          requestInfo,
        );
      }

      return updatedTier;
    } catch (error) {
      // Activity Log 기록 (실패)
      if (requestInfo) {
        await this.activityLog.logFailure(
          {
            userId: setBy, // 관리자 ID (액션을 수행한 사용자)
            isAdmin: true,
            activityType: ActivityType.COMMISSION_RATE_SET,
            description: `커미션 수동 요율 설정 실패 - 요율: ${customRate.toString()}`,
            metadata: {
              affiliateId, // 대상 어필리에이트 유저 ID
              customRate: customRate.toString(),
              error: error instanceof Error ? error.message : String(error),
            },
          },
          requestInfo,
        );
      }

      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof CommissionException) {
        this.logger.warn(
          `커미션 수동 요율 설정 실패 (도메인 예외) - affiliateId: ${affiliateId}, customRate: ${customRate.toString()}`,
          error.message,
        );
      } else {
        // 예상치 못한 시스템 에러만 ERROR 레벨로 로깅
        this.logger.error(
          `커미션 수동 요율 설정 실패 - affiliateId: ${affiliateId}, customRate: ${customRate.toString()}`,
          error,
        );
      }

      throw error;
    }
  }
}
