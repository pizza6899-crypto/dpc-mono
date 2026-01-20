import { Prisma } from '@repo/database';

export class WageringPolicy {
    /**
     * 취소 가능 잔액 임계값 체크
     * (유저 잔액이 임계값보다 작으면 오링으로 간주하여 롤링 취소 가능)
     */
    canBeCancelled(currentBalance: Prisma.Decimal, threshold: Prisma.Decimal | null): boolean {
        if (!threshold) {
            // 임계값이 설정되지 않았다면 잔액 부족으로 인한 자동 취소는 동작하지 않음 (0일수도 있음)
            // 보통은 0.1 등 최소 단위를 설정함.
            return false;
        }
        return currentBalance.lessThan(threshold);
    }

    /**
     * 기여도 계산 (게임별 가중치 적용)
     * 예: 슬롯 100%, 카지노 50%
     * 현재는 단순화를 위해 외부에서 계산된 contributionAmount를 받는 구조이거나,
     * 추후 카테고리 기여도 등을 받아서 처리할 수 있음.
     */
    calculateContribution(betAmount: Prisma.Decimal, contributionRate: number): Prisma.Decimal {
        return betAmount.mul(contributionRate);
    }
}
