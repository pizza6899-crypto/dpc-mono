// src/modules/wallet/application/get-user-balance-admin.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WalletQueryService } from './wallet-query.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { UserWallet } from '../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { WalletNotFoundException } from '../domain';
import type { ExchangeCurrencyCode } from '@repo/database';

interface GetUserBalanceAdminParams {
  userId: bigint;
  currency?: ExchangeCurrencyCode; // 없으면 모든 통화 반환
}

interface GetUserBalanceAdminResult {
  wallet: UserWallet | UserWallet[];
}

/**
 * 관리자용 사용자 잔액 조회 Use Case
 *
 * 관리자가 특정 사용자의 잔액을 조회합니다.
 * 사용자 존재 여부를 검증한 후 잔액을 조회합니다.
 * 특정 통화를 지정하면 해당 통화의 잔액만 반환하고,
 * 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.
 */
@Injectable()
export class GetUserBalanceAdminService {
  private readonly logger = new Logger(GetUserBalanceAdminService.name);

  constructor(
    private readonly walletQueryService: WalletQueryService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) { }

  async execute(
    params: GetUserBalanceAdminParams,
  ): Promise<GetUserBalanceAdminResult> {
    const { userId, currency } = params;

    // 1. 사용자 존재 여부 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. 잔액 조회
    if (currency) {
      // 특정 통화 조회 (자동 생성 안함)
      const wallet = await this.walletQueryService.getWallet(userId, currency, false);

      if (!wallet) {
        // 동기 생성 정책으로 인해 지갑이 없으면 에러 처리
        throw new WalletNotFoundException(userId, currency);
      }

      return { wallet };
    }

    // 모든 통화 반환 (자동 생성 안함)
    const wallets = await this.walletQueryService.getWallets(userId, false);

    // 지갑이 하나도 없는 경우도 빈 배열 반환 (동기 생성 정책상 가입 시 생성되지만, 예외 상황 고려)
    return { wallet: wallets };
  }
}
