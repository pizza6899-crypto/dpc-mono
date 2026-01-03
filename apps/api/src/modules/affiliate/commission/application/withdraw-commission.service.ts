import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { AffiliateWallet } from '../domain';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';

interface WithdrawCommissionParams {
  affiliateId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class WithdrawCommissionService {
  constructor(
    @Inject(AFFILIATE_WALLET_REPOSITORY)
    private readonly walletRepository: AffiliateWalletRepositoryPort,
  ) { }

  @Transactional()
  async execute({
    affiliateId,
    currency,
    amount,
  }: WithdrawCommissionParams): Promise<AffiliateWallet> {
    // 1. 월렛 조회
    const wallet = await this.walletRepository.getByAffiliateIdAndCurrency(
      affiliateId,
      currency,
    );

    // 2. 월렛의 withdraw 호출 (내부에서 출금 가능 여부 검증 및 잔액 차감)
    // wallet.withdraw()는 내부에서 canWithdraw()를 호출하여 검증하므로
    // 별도의 Policy 검증은 불필요
    wallet.withdraw(amount);

    // 3. 월렛 업데이트
    return await this.walletRepository.upsert(wallet);
  }
}
