// src/modules/affiliate/commission/application/withdraw-commission.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { AffiliateWallet, CommissionException } from '../domain';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface WithdrawCommissionParams {
  affiliateId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class WithdrawCommissionService {
  private readonly logger = new Logger(WithdrawCommissionService.name);

  constructor(
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly walletRepository: AffiliateWalletRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  @Transactional()
  async execute({
    affiliateId,
    currency,
    amount,
    requestInfo,
  }: WithdrawCommissionParams): Promise<AffiliateWallet> {
    try {
      // 1. 월렛 조회
      const wallet = await this.walletRepository.getByAffiliateIdAndCurrency(
        affiliateId,
        currency,
      );

      // 출금 전 잔액 저장 (로그용)
      const beforeBalance = wallet.availableBalance;

      // 2. 월렛의 withdraw 호출 (내부에서 출금 가능 여부 검증 및 잔액 차감)
      // wallet.withdraw()는 내부에서 canWithdraw()를 호출하여 검증하므로
      // 별도의 Policy 검증은 불필요
      wallet.withdraw(amount);

      // 3. 월렛 업데이트
      const updatedWallet = await this.walletRepository.upsert(wallet);

      // 4. Audit Log 기록 (성공)
      if (requestInfo) {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_WITHDRAW',
              metadata: {
                affiliateId: affiliateId.toString(),
                currency,
                amount: amount.toString(),
                beforeBalance: beforeBalance.toString(),
                afterBalance: updatedWallet.availableBalance.toString(),
                pendingBalance: updatedWallet.pendingBalance.toString(),
                totalEarned: updatedWallet.totalEarned.toString(),
              },
            },
          },
          requestInfo,
        );
      }

      this.logger.log(
        `커미션 출금 완료 - affiliateId: ${affiliateId}, currency: ${currency}, amount: ${amount.toString()}`,
      );

      return updatedWallet;
    } catch (error) {
      // 5. Audit Log 기록 (실패)
      if (requestInfo) {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_WITHDRAW',
              metadata: {
                affiliateId: affiliateId.toString(),
                currency,
                amount: amount.toString(),
                error: error instanceof Error ? error.message : String(error),
              },
            },
          },
          requestInfo,
        );
      }

      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof CommissionException) {
        this.logger.warn(
          `커미션 출금 실패 (도메인 예외) - affiliateId: ${affiliateId}, currency: ${currency}, amount: ${amount.toString()}`,
          error.message,
        );
      } else {
        // 예상치 못한 시스템 에러만 ERROR 레벨로 로깅
        this.logger.error(
          `커미션 출금 실패 - affiliateId: ${affiliateId}, currency: ${currency}, amount: ${amount.toString()}`,
          error,
        );
      }

      throw error;
    }
  }
}
