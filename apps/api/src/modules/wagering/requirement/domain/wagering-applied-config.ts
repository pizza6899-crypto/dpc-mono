import { Prisma } from '@prisma/client';

export interface WageringAppliedConfig {
    /**
     * 입금 원천 ID (프로모션 시 입금 롤링 복구를 위함)
     */
    depositId?: string;

    /**
     * 생성 시점의 정책 스냅샷
     */
    snapshot?: {
        minBet?: Prisma.Decimal | number | string;
        maxBet?: Prisma.Decimal | number | string;
        cancellationThreshold?: Prisma.Decimal | number | string;
        defaultBonusExpiryDays?: number;
        defaultDepositMultiplier?: string;
        isWageringCheckEnabled?: boolean;
        currencyThreshold?: string;
    };

    /**
     * 기타 동적 메타데이터
     */
    [key: string]: any;
}
