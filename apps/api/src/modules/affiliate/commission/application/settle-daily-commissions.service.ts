// src/modules/affiliate/commission/application/settle-daily-commissions.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { AffiliateWallet, CommissionPolicy, CommissionException } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { WALLET_CURRENCIES, GAMING_CURRENCIES } from 'src/utils/currency.util';
import { Transactional } from '@nestjs-cls/transactional';

interface SettleDailyCommissionsParams {
  settlementDate: Date; // 정산 기준일
  affiliateId?: string; // 특정 어필리에이트만, 없으면 전체
}

interface SettleDailyCommissionsResult {
  settledCount: number;
  totalAmount: Prisma.Decimal;
}

@Injectable()
export class SettleDailyCommissionsService {
  private readonly logger = new Logger(SettleDailyCommissionsService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly commissionRepository: AffiliateCommissionRepositoryPort,
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly walletRepository: AffiliateWalletRepositoryPort,
  ) {}

  /**
   * 일일 커미션 정산 처리
   * - 단일 어필리에이트: 개별 트랜잭션으로 처리
   * - 전체 어필리에이트: 각 어필리에이트별로 개별 트랜잭션으로 배치 처리
   *   (전체를 하나의 트랜잭션으로 처리하지 않음 - 확장성 및 안정성 고려)
   *   대량 레코드 처리를 위해 배치 크기 제한 및 페이지네이션 적용
   */
  async execute({
    settlementDate,
    affiliateId,
  }: SettleDailyCommissionsParams): Promise<SettleDailyCommissionsResult> {
    // 단일 어필리에이트 처리
    if (affiliateId) {
      return await this.settleForAffiliate(affiliateId, settlementDate);
    }

    // 전체 어필리에이트 배치 처리
    // PENDING 커미션이 있는 어필리에이트만 조회하여 각각 개별 트랜잭션으로 처리
    // 대량 레코드 처리를 위해 배치 크기 제한 적용 (기본값: 100)
    const BATCH_SIZE = 100;
    let offset = 0;
    let hasMore = true;

    let totalSettledCount = 0;
    let totalAmount = new Prisma.Decimal('0');
    let successCount = 0;
    let failureCount = 0;
    let totalProcessed = 0;

    this.logger.log('전체 어필리에이트 정산 시작');

    // 배치 단위로 처리 (메모리 효율성 및 성능 고려)
    while (hasMore) {
      const affiliateIds =
        await this.commissionRepository.findAffiliateIdsWithPendingCommissions({
          limit: BATCH_SIZE,
          offset,
        });

      if (affiliateIds.length === 0) {
        hasMore = false;
        break;
      }

      this.logger.log(
        `배치 처리 중... (${offset + 1}~${offset + affiliateIds.length} / 총 ${totalProcessed + affiliateIds.length}명 예상)`,
      );

      // 각 어필리에이트별로 개별 트랜잭션으로 처리
      for (const id of affiliateIds) {
        try {
          const result = await this.settleForAffiliate(id, settlementDate);
          totalSettledCount += result.settledCount;
          totalAmount = totalAmount.add(result.totalAmount);
          successCount++;
        } catch (error) {
          failureCount++;
          // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
          if (error instanceof CommissionException) {
            this.logger.warn(
              `어필리에이트 정산 실패 (도메인 예외) - affiliateId: ${id}`,
              error.message,
            );
          } else {
            // 배치 처리 중 일부 실패는 정상적인 시나리오일 수 있으므로 WARN 레벨로 로깅
            // (다른 어필리에이트 처리에 영향 없음)
            this.logger.warn(
              `어필리에이트 정산 실패 - affiliateId: ${id}`,
              error instanceof Error ? error.message : String(error),
            );
          }
          // 개별 실패는 로깅만 하고 계속 진행 (다른 어필리에이트 처리에 영향 없음)
        }
        totalProcessed++;
      }

      // 다음 배치로 이동
      offset += BATCH_SIZE;
      hasMore = affiliateIds.length === BATCH_SIZE; // 마지막 배치인지 확인

      // 진행 상황 로깅 (배치마다)
      this.logger.log(
        `배치 처리 완료 - 진행: ${totalProcessed}명, 성공: ${successCount}, 실패: ${failureCount}`,
      );
    }

    if (totalProcessed === 0) {
      this.logger.log('정산할 PENDING 커미션이 없습니다.');
      return { settledCount: 0, totalAmount: new Prisma.Decimal('0') };
    }

    this.logger.log(
      `전체 어필리에이트 정산 완료 - 총 처리: ${totalProcessed}명, 성공: ${successCount}, 실패: ${failureCount}, 총 정산: ${totalSettledCount}건, 총 금액: ${totalAmount.toString()}`,
    );

    return {
      settledCount: totalSettledCount,
      totalAmount,
    };
  }

  /**
   * 단일 어필리에이트의 커미션 정산 처리 (트랜잭션 포함)
   */
  @Transactional()
  private async settleForAffiliate(
    affiliateId: string,
    settlementDate: Date,
  ): Promise<SettleDailyCommissionsResult> {
    // 통화별로 처리 (월렛으로 사용 가능한 통화만)
    // WALLET_CURRENCIES가 환경 변수로 설정되어 있으면 사용,
    // 없으면 GAMING_CURRENCIES를 사용 (게임에서 실제로 사용되는 통화)
    const currencies: ExchangeCurrencyCode[] =
      WALLET_CURRENCIES.length > 0
        ? ([...WALLET_CURRENCIES] as ExchangeCurrencyCode[])
        : Object.values(ExchangeCurrencyCode);

    let totalSettledCount = 0;
    let totalAmount = new Prisma.Decimal('0');

    // 통화별로 처리
    for (const currency of currencies) {
      // 월렛 조회 (없으면 생성)
      let wallet = await this.walletRepository.findByAffiliateIdAndCurrency(
        affiliateId,
        currency,
      );

      if (!wallet) {
        // 월렛이 없으면 생성 (이론적으로는 있어야 함)
        wallet = AffiliateWallet.create({
          affiliateId,
          currency,
        });
        wallet = await this.walletRepository.upsert(wallet);
      }

      // 대량 커미션 처리를 위한 배치 처리
      // 한 어필리에이트의 특정 통화에 대해 수만 개의 PENDING 커미션이 있을 수 있음
      const COMMISSION_BATCH_SIZE = 1000;
      let commissionOffset = 0;
      let hasMoreCommissions = true;
      let currencySettledCount = 0;
      let currencySettleAmount = new Prisma.Decimal('0');

      while (hasMoreCommissions) {
        // 배치 단위로 PENDING 커미션 조회
        const pendingCommissions =
          await this.commissionRepository.findPendingByAffiliateId(
            affiliateId,
            currency,
            {
              limit: COMMISSION_BATCH_SIZE,
              offset: commissionOffset,
            },
          );

        if (pendingCommissions.length === 0) {
          hasMoreCommissions = false;
          break;
        }

        // 정산할 총 금액 계산 및 커미션 ID 수집
        const batchSettleAmount = pendingCommissions.reduce(
          (sum, comm) => sum.add(comm.commission),
          new Prisma.Decimal('0'),
        );
        const commissionIds = pendingCommissions
          .map((comm) => comm.id)
          .filter((id): id is bigint => id !== null); // null 제거

        // 월렛의 settlePendingCommission 호출 (배치마다 누적)
        wallet.settlePendingCommission(batchSettleAmount);
        await this.walletRepository.upsert(wallet);

        // 조회한 커미션만 상태 일괄 업데이트 (PENDING → AVAILABLE)
        // 데이터 일관성 보장: 조회한 커미션만 정산 처리
        const batchSettledCount =
          await this.commissionRepository.settlePendingCommissions(
            commissionIds,
            settlementDate,
          );

        currencySettledCount += batchSettledCount;
        currencySettleAmount = currencySettleAmount.add(batchSettleAmount);

        // 다음 배치로 이동
        commissionOffset += COMMISSION_BATCH_SIZE;
        hasMoreCommissions =
          pendingCommissions.length === COMMISSION_BATCH_SIZE;
      }

      totalSettledCount += currencySettledCount;
      totalAmount = totalAmount.add(currencySettleAmount);
    }

    return {
      settledCount: totalSettledCount,
      totalAmount,
    };
  }
}
