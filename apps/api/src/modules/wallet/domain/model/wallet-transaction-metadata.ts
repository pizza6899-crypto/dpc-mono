import { WalletStatus } from '@prisma/client';

/**
 * WalletTransaction 메타데이터 기본 인터페이스
 */
export interface WalletTransactionMetadata {
    description?: string;
    [key: string]: any;
}

/**
 * 상태 변경 기록 메타데이터
 */
export interface StatusChangeMetadata extends WalletTransactionMetadata {
    prevStatus: WalletStatus;
    nextStatus: WalletStatus;
    changedBy: 'SYSTEM' | 'ADMIN' | 'USER';
    reason?: string;
}

/**
 * 모든 지갑 트랜잭션 메타데이터의 유니온 타입
 */
export type AnyWalletTransactionMetadata =
    | StatusChangeMetadata
    | WalletTransactionMetadata;
