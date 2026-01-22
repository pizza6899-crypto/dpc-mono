import { WalletStatus } from '@prisma/client';

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
}

/**
 * 상태 변경 기록 메타데이터
 */
export interface StatusChangeMetadata extends BaseMetadata {
    prevStatus: WalletStatus;
    nextStatus: WalletStatus;
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
 * 기타 일반 메타데이터
 */
export interface DefaultMetadata extends BaseMetadata {
    [key: string]: any; // 하위 호환성 및 기타 용도 (지양해야 함)
}

/**
 * 모든 지갑 트랜잭션 메타데이터의 유니온 타입
 */
export type AnyWalletTransactionMetadata =
    | CasinoBetMetadata
    | CasinoWinMetadata
    | StatusChangeMetadata
    | AdjustmentMetadata
    | DefaultMetadata;
