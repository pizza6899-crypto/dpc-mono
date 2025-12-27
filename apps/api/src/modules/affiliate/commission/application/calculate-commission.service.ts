// src/modules/affiliate/commission/application/calculate-commission.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AffiliateTierLevel,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@prisma/client';
import {
  AffiliateCommission,
  AffiliateTier,
  AffiliateWallet,
  CommissionPolicy,
} from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { FindReferralBySubUserIdService } from '../../referral/application/find-referral-by-sub-user-id.service';
import { IdUtil } from 'src/utils/id.util';
import { Transactional } from '@nestjs-cls/transactional';

interface CalculateCommissionParams {
  subUserId: string; // 게임 플레이한 유저
  gameRoundId: bigint;
  wagerAmount: Prisma.Decimal;
  winAmount?: Prisma.Decimal | null;
  currency: ExchangeCurrencyCode;
  gameCategory?: GameCategory | null;
}

@Injectable()
export class CalculateCommissionService {
  private readonly logger = new Logger(CalculateCommissionService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly commissionRepository: AffiliateCommissionRepositoryPort,
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly tierRepository: AffiliateTierRepositoryPort,
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly walletRepository: AffiliateWalletRepositoryPort,
    private readonly findReferralService: FindReferralBySubUserIdService,
    private readonly policy: CommissionPolicy,
  ) {}

  @Transactional()
  async execute({
    subUserId,
    gameRoundId,
    wagerAmount,
    winAmount,
    currency,
    gameCategory,
  }: CalculateCommissionParams): Promise<AffiliateCommission | null> {
    try {
      // 1. 레퍼럴 관계 조회 (subUserId → affiliateId)
      const referral = await this.findReferralService.execute({ subUserId });

      // 레퍼럴 관계가 없으면 커미션 생성하지 않음
      if (!referral) {
        return null;
      }

      const affiliateId = referral.affiliateId;

      // 2. 중복 체크 (같은 gameRoundId로 이미 커미션이 생성되었는지 확인)
      const existingCommission =
        await this.commissionRepository.findByGameRoundId(gameRoundId);
      if (existingCommission) {
        return null; // 이미 생성된 커미션이 있으면 중복 생성하지 않음
      }

      // 3. 티어 조회 (없으면 기본 티어로 생성)
      let tier = await this.tierRepository.findByAffiliateId(affiliateId);
      if (!tier) {
        const baseRate = this.policy.getBaseRateForTier(
          AffiliateTierLevel.BRONZE,
        );
        tier = AffiliateTier.create({
          uid: IdUtil.generateUid(),
          affiliateId,
          tier: AffiliateTierLevel.BRONZE,
          baseRate,
        });
        tier = await this.tierRepository.upsert(tier);
      }

      // 4. 적용 요율 계산 (수동 요율 우선, 없으면 기본 요율)
      const effectiveRate = tier.getEffectiveRate();

      // 5. 커미션 금액 계산 (wagerAmount * rate)
      const commission = this.policy.calculateCommission(
        wagerAmount,
        effectiveRate,
      );

      // 6. 커미션 엔티티 생성 및 저장
      const commissionEntity = AffiliateCommission.create({
        uid: IdUtil.generateUid(),
        affiliateId,
        subUserId,
        gameRoundId,
        wagerAmount,
        winAmount: winAmount ?? null,
        commission,
        rateApplied: effectiveRate,
        currency,
        gameCategory: gameCategory ?? null,
      });

      const savedCommission =
        await this.commissionRepository.create(commissionEntity);

      // 7. 월렛 조회 (없으면 생성)
      let wallet = await this.walletRepository.findByAffiliateIdAndCurrency(
        affiliateId,
        currency,
      );
      if (!wallet) {
        wallet = AffiliateWallet.create({
          affiliateId,
          currency,
        });
        wallet = await this.walletRepository.upsert(wallet);
      }

      // 8. 월렛에 pendingBalance 추가 (addPendingCommission)
      wallet.addPendingCommission(commission);
      await this.walletRepository.upsert(wallet);

      // 9. 티어의 월간 베팅 금액 업데이트
      // 엔티티를 수정한 후 upsert를 사용하여 일관성 유지
      tier.updateMonthlyWagerAmount(wagerAmount);
      await this.tierRepository.upsert(tier);

      return savedCommission;
    } catch (error) {
      this.logger.error(
        `커미션 계산 실패 - subUserId: ${subUserId}, gameRoundId: ${gameRoundId?.toString()}, wagerAmount: ${wagerAmount?.toString()}`,
        error,
      );
      throw error;
    }
  }
}
