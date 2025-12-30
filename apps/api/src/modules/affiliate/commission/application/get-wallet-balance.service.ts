// src/modules/affiliate/commission/application/get-wallet-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@repo/database';
import { AffiliateWallet, CommissionException } from '../domain';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface GetWalletBalanceParams {
  affiliateId: bigint;
  currency?: ExchangeCurrencyCode; // 없으면 모든 통화 반환
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class GetWalletBalanceService {
  private readonly logger = new Logger(GetWalletBalanceService.name);

  constructor(
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly repository: AffiliateWalletRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    affiliateId,
    currency,
    requestInfo,
  }: GetWalletBalanceParams): Promise<AffiliateWallet | AffiliateWallet[]> {
    try {
      let wallets: AffiliateWallet | AffiliateWallet[];

      if (currency) {
        // 특정 통화 조회
        const wallet = await this.repository.findByAffiliateIdAndCurrency(
          affiliateId,
          currency,
        );

        if (!wallet) {
          const newWallet = AffiliateWallet.create({
            affiliateId,
            currency,
          });
          wallets = await this.repository.upsert(newWallet);
        } else {
          wallets = wallet;
        }
      } else {
        // 모든 통화 반환
        wallets = await this.repository.findByAffiliateId(affiliateId);
      }

      // Audit Log 기록 (사용자가 월렛 잔액 조회)
      if (requestInfo) {
        const walletArray = Array.isArray(wallets) ? wallets : [wallets];
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_WALLET_BALANCE_VIEW',
              metadata: {
                affiliateId: affiliateId.toString(),
                currency: currency || 'all',
                walletCount: walletArray.length,
              },
            },
          },
          requestInfo,
        );
      }

      return wallets;
    } catch (error) {
      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof CommissionException) {
        this.logger.warn(
          `월렛 잔액 조회 실패 (도메인 예외) - affiliateId: ${affiliateId}, currency: ${currency || 'all'}`,
          error.message,
        );
      } else {
        // 예상치 못한 시스템 에러만 ERROR 레벨로 로깅
        this.logger.error(
          `월렛 잔액 조회 실패 - affiliateId: ${affiliateId}, currency: ${currency || 'all'}`,
          error,
        );
      }
      throw error;
    }
  }
}
