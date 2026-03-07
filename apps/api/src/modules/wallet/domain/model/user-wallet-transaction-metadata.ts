import type { UserWalletStatus } from '@prisma/client';

/**
 * 상세 잔액 변경 내역
 */
export interface BalanceDetail {
  mainBalanceChange: string;
  mainBeforeAmount: string;
  mainAfterAmount: string;
  bonusBalanceChange: string;
  bonusBeforeAmount: string;
  bonusAfterAmount: string;
}

/**
 * 기본 메타데이터 (공통 필드)
 */
export interface BaseMetadata {
  description?: string;
  traceId?: string; // 추적 ID (Optional)
  adminId?: string; // 관리자 ID (Optional - Adjustment 시)
  balanceDetail?: BalanceDetail; // 상세 잔액 변경 내역
}

/**
 * 카지노 베팅 메타데이터
 */
export interface CasinoBetMetadata extends BaseMetadata {
  roundId: string;
  gameId: string;
  aggregatorTxId: string;
  gameTransactionId: string;
  provider: string;
  splitType?: 'CASH' | 'BONUS';
  // 필요 시 추가 필드 정의
}

/**
 * 카지노 당첨(Win) 메타데이터
 */
export interface CasinoWinMetadata extends BaseMetadata {
  roundId: string;
  gameId: string;
  aggregatorTxId: string;
  gameTransactionId: string;
  provider: string;
  winType?: string; // e.g., 'NORMAL', 'JACKPOT'
  isOrphaned?: boolean;
}

/**
 * 카지노 환불(Refund) 메타데이터 (Push/Tie 등)
 */
export interface CasinoRefundMetadata extends BaseMetadata {
  roundId: string;
  reason: string;
  aggregatorRoundId: string;
}

/**
 * 상태 변경 기록 메타데이터
 */
export interface StatusChangeMetadata extends BaseMetadata {
  prevStatus: UserWalletStatus;
  nextStatus: UserWalletStatus;
  changedBy: 'SYSTEM' | 'ADMIN' | 'USER';
  reason?: string;
}

/**
 * 관리자 조정(Adjustment) 메타데이터
 */
export interface AdjustmentMetadata extends BaseMetadata {
  adminId: string;
  reasonCode: string;
  internalNote?: string;
  actionName?: string;
}

/**
 * 프로모션/쿠폰 적용 메타데이터
 */
export interface PromotionMetadata extends BaseMetadata {
  promotionId: string;
  code?: string;
  promotionType: string;
}

/**
 * 금고(Vault) 작업 메타데이터
 */
export interface VaultOperationMetadata extends BaseMetadata {
  operation: string; // 'DEPOSIT' | 'WITHDRAW'
  cashBefore?: string;
  cashAfter?: string;
  vaultBefore?: string;
  vaultAfter?: string;
}

/**
 * 출금 처리/환불 메타데이터
 */
export interface WithdrawalMetadata extends BaseMetadata {
  withdrawalId: string;
  reason?: string;
}

/**
 * 입금 처리 메타데이터
 */
export interface DepositMetadata extends BaseMetadata {
  depositId: string;
  promotionId?: string;
  bonusAmount?: string;
  multiplier?: string;
}

/**
 * 기타 일반 메타데이터
 */
export interface DefaultMetadata extends BaseMetadata { }

/**
 * 모든 지갑 트랜잭션 메타데이터의 유니온 타입
 */
export type AnyWalletTransactionMetadata =
  | CasinoBetMetadata
  | CasinoWinMetadata
  | CasinoRefundMetadata
  | StatusChangeMetadata
  | AdjustmentMetadata
  | PromotionMetadata
  | VaultOperationMetadata
  | WithdrawalMetadata
  | DepositMetadata
  | DefaultMetadata;
