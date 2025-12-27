// src/modules/affiliate/commission/application/get-wallet-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { AffiliateWallet } from '../domain';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';

interface GetWalletBalanceParams {
  affiliateId: string;
  currency?: ExchangeCurrencyCode; // 없으면 모든 통화 반환
}

@Injectable()
export class GetWalletBalanceService {
  private readonly logger = new Logger(GetWalletBalanceService.name);

  constructor(
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly repository: AffiliateWalletRepositoryPort,
  ) {}

  async execute({
    affiliateId,
    currency,
  }: GetWalletBalanceParams): Promise<AffiliateWallet | AffiliateWallet[]> {
    try {
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
          return await this.repository.upsert(newWallet);
        }

        return wallet;
      }

      // 모든 통화 반환
      return await this.repository.findByAffiliateId(affiliateId);
    } catch (error) {
      this.logger.error(
        `월렛 잔액 조회 실패 - affiliateId: ${affiliateId}, currency: ${currency || 'all'}`,
        error,
      );
      throw error;
    }
  }
}
