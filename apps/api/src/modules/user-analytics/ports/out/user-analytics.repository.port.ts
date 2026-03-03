import { Prisma } from '@prisma/client';
import { UserGlobalTotalStats, UserGlobalHourlyStats } from '../../domain';

export const USER_ANALYTICS_REPOSITORY = Symbol('USER_ANALYTICS_REPOSITORY');

/**
 * 전역 통계 업데이트를 위한 DTO
 */
export interface UpdateUserAnalyticsDto {
    userId: bigint;
    date?: Date; // 지정되지 않으면 현재 날짜(UTC 자정) 기준

    // 증감분 (Deltas) - USD 기준
    depositUsd?: Prisma.Decimal;
    withdrawUsd?: Prisma.Decimal;
    betUsd?: Prisma.Decimal;
    winUsd?: Prisma.Decimal;
    promoUsd?: Prisma.Decimal;
}

export interface UserAnalyticsRepositoryPort {
    /**
     * 유저의 평생 통계를 조회합니다.
     */
    getTotalStats(userId: bigint): Promise<UserGlobalTotalStats | null>;

    /**
     * 유저의 특정 시간 통계를 조회합니다.
     */
    getHourlyStats(userId: bigint, hour: Date): Promise<UserGlobalHourlyStats | null>;

    /**
     * 유저의 전역/시간별 통계를 원자적으로 증감 업데이트합니다. (Upsert 포함)
     * 
     * @param dto 업데이트할 증감액 정보
     */
    increaseStats(dto: UpdateUserAnalyticsDto): Promise<void>;
}
