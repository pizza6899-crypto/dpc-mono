// src/modules/affiliate/commission/application/calculate-commission.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateCommission, AffiliateWallet, CommissionPolicy } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { FindReferralBySubUserIdService } from '../../referral/application/find-referral-by-sub-user-id.service';
import { Transactional } from '@nestjs-cls/transactional';

interface CalculateCommissionParams {
  subUserId: bigint; // 게임 플레이한 유저
  gameRoundId: bigint;
  wagerAmount: Prisma.Decimal;
  winAmount?: Prisma.Decimal | null;
  currency: ExchangeCurrencyCode;
  gameCategory?: string | null;
}

@Injectable()
export class CalculateCommissionService {
  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly commissionRepository: AffiliateCommissionRepositoryPort,
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly walletRepository: AffiliateWalletRepositoryPort,
    private readonly findReferralService: FindReferralBySubUserIdService,
    private readonly policy: CommissionPolicy,
  ) { }

  @Transactional()
  async execute({
    subUserId,
    gameRoundId,
    wagerAmount,
    winAmount,
    currency,
    gameCategory,
  }: CalculateCommissionParams): Promise<AffiliateCommission | null> {
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

    // 3. 티어 기반 요율 조회 (GetAffiliateRateService 사용)
    const effectiveRate = new Prisma.Decimal('0.05'); // 임시 데이터: 5%

    // 4. 커미션 금액 계산 (wagerAmount * rate)
    const commission = this.policy.calculateCommission(
      wagerAmount,
      effectiveRate,
    );

    // 5. 커미션 엔티티 생성 및 저장
    const commissionEntity = AffiliateCommission.create({
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

    // 6. 월렛 조회 (없으면 생성)
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

    // 7. 월렛에 pendingBalance 추가 (addPendingCommission)
    wallet.addPendingCommission(commission);
    await this.walletRepository.upsert(wallet);

    return savedCommission;
  }
}
