// src/modules/affiliate/commission/application/reset-custom-rate.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AffiliateTier, CommissionException } from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';

interface ResetCustomRateParams {
  affiliateId: bigint;
  resetBy: bigint; // 관리자 ID
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class ResetCustomRateService {
  private readonly logger = new Logger(ResetCustomRateService.name);

  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Transactional()
  async execute({
    affiliateId,
    resetBy,
    requestInfo,
  }: ResetCustomRateParams): Promise<AffiliateTier> {
    try {
      // 티어 조회
      const tier = await this.repository.getByAffiliateId(affiliateId);

      // 변경 전 상태 저장 (로그용)
      const previousCustomRate = tier.customRate;
      const wasCustomRate = tier.isCustomRate;

      // 수동 요율 해제 (엔티티 상태 변경)
      tier.resetCustomRate();

      // 엔티티를 변경한 후 Repository에 저장
      // repository.resetCustomRate()는 직접 DB 업데이트하지만,
      // 엔티티를 변경한 후 upsert()를 사용하는 것이 더 일관성 있는 패턴
      const updatedTier = await this.repository.upsert(tier);

      // Activity Log 기록 (성공)
      if (requestInfo) {
        await this.activityLog.logSuccess(
          {
            userId: resetBy, // 관리자 ID (액션을 수행한 사용자)
            isAdmin: true,
            activityType: ActivityType.COMMISSION_RATE_RESET,
            description: `커미션 수동 요율 해제 완료 - 기본 요율로 복귀 (티어: ${updatedTier.tier}, 기본 요율: ${updatedTier.baseRate.toString()}), 해제자: ${resetBy}`,
            metadata: {
              affiliateId, // 대상 어필리에이트 유저 ID
              tier: updatedTier.tier,
              baseRate: updatedTier.baseRate.toString(),
              previousCustomRate: previousCustomRate?.toString() || null,
              wasCustomRate,
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
            userId: resetBy, // 관리자 ID (액션을 수행한 사용자)
            isAdmin: true,
            activityType: ActivityType.COMMISSION_RATE_RESET,
            description: `커미션 수동 요율 해제 실패`,
            metadata: {
              affiliateId, // 대상 어필리에이트 유저 ID
              error: error instanceof Error ? error.message : String(error),
            },
          },
          requestInfo,
        );
      }

      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof CommissionException) {
        this.logger.warn(
          `커미션 수동 요율 해제 실패 (도메인 예외) - affiliateId: ${affiliateId}, resetBy: ${resetBy}`,
          error.message,
        );
      } else {
        // 예상치 못한 시스템 에러만 ERROR 레벨로 로깅
        this.logger.error(
          `커미션 수동 요율 해제 실패 - affiliateId: ${affiliateId}, resetBy: ${resetBy}`,
          error,
        );
      }

      throw error;
    }
  }
}
