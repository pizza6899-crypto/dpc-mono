import { UserWalletStatus, UserWalletTransactionType } from '@prisma/client';
import type { UserWallet } from './model/user-wallet.entity';
import { WalletStatusException } from './wallet.exception';

/**
 * UserWallet 도메인 정책 (Business Rules)
 *
 * 지갑의 상태나 거래 유형에 따른 비즈니스 규칙을 정의합니다.
 */
export class UserWalletPolicy {
  /**
   * 지갑이 현재 특정 거래를 수행할 수 있는 상태인지 검증합니다.
   *
   * @param wallet 지갑 엔티티
   * @param type 거래 유형
   * @throws WalletStatusException 거래가 허용되지 않는 경우
   */
  canPerformTransaction(
    wallet: UserWallet,
    type: UserWalletTransactionType,
  ): void {
    const status = wallet.status;

    // 1. 공통 차단 상태
    if (status === UserWalletStatus.TERMINATED) {
      throw new WalletStatusException(
        `Cannot perform transaction ${type} on a terminated wallet`,
      );
    }

    if (status === UserWalletStatus.INACTIVE) {
      throw new WalletStatusException(
        `Wallet is inactive. Please activate it first.`,
      );
    }

    // 2. 동결 상태 처리
    if (status === UserWalletStatus.FROZEN) {
      // 관리자 보정이나 상태 변경 기록 외에는 모두 차단
      const allowedInFrozen: UserWalletTransactionType[] = [
        UserWalletTransactionType.ADJUSTMENT,
        UserWalletTransactionType.STATUS_CHANGE,
      ];
      if (!allowedInFrozen.includes(type)) {
        throw new WalletStatusException(
          `Wallet is frozen. Transaction ${type} is not allowed.`,
        );
      }
    }

    // 3. 읽기 전용 상태
    if (status === UserWalletStatus.READ_ONLY) {
      // 모든 잔액 변동 거래 차단
      const allowedInReadOnly: UserWalletTransactionType[] = [
        UserWalletTransactionType.STATUS_CHANGE,
      ];
      if (!allowedInReadOnly.includes(type)) {
        throw new WalletStatusException(
          `Wallet is read-only. Transaction ${type} is not allowed.`,
        );
      }
    }

    // 4. 특정 거래 유형별 상세 정책
    switch (type) {
      case UserWalletTransactionType.WITHDRAW:
        if (status !== UserWalletStatus.ACTIVE) {
          throw new WalletStatusException(
            `Withdrawal is only allowed in ACTIVE status. Current status: ${status}`,
          );
        }
        break;

      case UserWalletTransactionType.BET:
      case UserWalletTransactionType.DEPOSIT:
      case UserWalletTransactionType.WIN:
      case UserWalletTransactionType.REFUND:
      case UserWalletTransactionType.BONUS_IN:
      case UserWalletTransactionType.BONUS_OUT:
        // 출금 제한(WITHDRAWAL_RESTRICTED) 상태에서도 베팅이나 입금은 가능
        const allowedStatuses: UserWalletStatus[] = [
          UserWalletStatus.ACTIVE,
          UserWalletStatus.WITHDRAWAL_RESTRICTED,
        ];
        if (!allowedStatuses.includes(status)) {
          throw new WalletStatusException(
            `Transaction ${type} is not allowed in ${status} status`,
          );
        }
        break;

      case UserWalletTransactionType.ADJUSTMENT:
        // ADJUSTMENT는 FROZEN에서도 가능 (위에서 이미 개별 처리됨)
        break;

      case UserWalletTransactionType.STATUS_CHANGE:
        // 상태 변경 기록은 언제나 허용
        break;

      default:
        // 기본적으로 ACTIVE인 경우만 허용 (정의되지 않은 타입에 대한 안전장치)
        if (
          status !== UserWalletStatus.ACTIVE &&
          status !== UserWalletStatus.WITHDRAWAL_RESTRICTED
        ) {
          throw new WalletStatusException(
            `Transaction ${type} is not allowed in ${status} status`,
          );
        }
        break;
    }
  }

  /**
   * 지갑 동결 가능 여부 확인
   */
  canFreeze(wallet: UserWallet): boolean {
    return wallet.status !== UserWalletStatus.TERMINATED;
  }

  /**
   * 지갑 활성화 가능 여부 확인
   */
  canActivate(wallet: UserWallet): boolean {
    return wallet.status !== UserWalletStatus.TERMINATED;
  }
}
