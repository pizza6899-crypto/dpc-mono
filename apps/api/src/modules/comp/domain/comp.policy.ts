import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompConfig } from './model/comp-config.entity';
import { CompWallet } from './model/comp-wallet.entity';
import {
  CompPolicyViolationException,
  InsufficientCompBalanceException,
} from './comp.exception';

@Injectable()
export class CompPolicy {
  /**
   * 적립 가능 여부를 검증합니다.
   * @param config 콤프 설정 (없을 경우 기본 허용)
   * @param userId 사용자 ID (로깅/예외용)
   */
  verifyEarn(config: CompConfig | null, userId: bigint): void {
    // 1. 설정이 아예 없으면 기본적으로 허용 (또는 정책에 따라 기본 거부할 수도 있음)
    if (!config) return;

    // 2. 시스템 전체 적립 비활성화 체크
    if (!config.canEarn()) {
      throw new CompPolicyViolationException(
        `Comp earn is currently disabled by system policy.`,
      );
    }

    // 3. (확장 가능) 유저별 블랙리스트, 일일 한도 체크 등
  }

  /**
   * 콤프 전환(사용) 가능 여부를 검증합니다.
   * @param config 콤프 설정
   * @param wallet 사용자 콤프 지갑
   * @param amount 전환 요청 금액
   */
  verifyClaim(
    config: CompConfig | null,
    wallet: CompWallet,
    amount: Prisma.Decimal,
  ): void {
    const userId = wallet.userId;

    // 1. 지갑 동결 여부 선제적 체크
    if (wallet.isFrozen) {
      throw new CompPolicyViolationException(
        `Comp wallet is frozen. Claim denied.`,
      );
    }

    // 2. 설정 관련 검증
    if (config) {
      // 2-1. 시스템 전체 전환 비활성화 체크
      if (!config.isClaimEnabled) {
        throw new CompPolicyViolationException(
          `Comp claim is currently disabled by system policy.`,
        );
      }

      // 2-2. 최소 전환 금액 체크
      if (amount.lessThan(config.minClaimAmount)) {
        throw new CompPolicyViolationException(
          `Claim amount (${amount}) is less than minimum allowed amount (${config.minClaimAmount}).`,
        );
      }
    }

    // 3. 잔액 검증
    if (wallet.balance.lessThan(amount)) {
      throw new InsufficientCompBalanceException(
        amount.toString(),
        wallet.balance.toString(),
      );
    }
  }

  /**
   * 관리자 차감(조정) 가능 여부를 검증합니다.
   * @param config 콤프 설정
   * @param wallet 사용자 콤프 지갑
   * @param amount 차감 요청 금액
   */
  verifyDeduct(
    config: CompConfig | null,
    wallet: CompWallet,
    amount: Prisma.Decimal,
  ): void {
    const userId = wallet.userId;

    // 1. 지갑 동결 여부 체크
    if (wallet.isFrozen) {
      throw new CompPolicyViolationException(
        `Comp wallet is frozen. Adjustment denied.`,
      );
    }

    // 2. 잔액 검증 (설정에서 마이너스 잔액을 허용하지 않는 경우에만 수행)
    const allowNegative = config?.allowNegativeBalance ?? true;
    if (!allowNegative && wallet.balance.lessThan(amount)) {
      throw new InsufficientCompBalanceException(
        amount.toString(),
        wallet.balance.toString(),
      );
    }
  }
}
