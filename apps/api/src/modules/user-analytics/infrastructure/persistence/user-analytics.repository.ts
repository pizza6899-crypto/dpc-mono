import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { sql } from 'kysely';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
    UserAnalyticsRepositoryPort,
    UpdateUserAnalyticsDto,
} from '../../ports/out/user-analytics.repository.port';
import { UserGlobalTotalStats, UserGlobalHourlyStats } from '../../domain';
import { UserAnalyticsMapper } from './user-analytics.mapper';

@Injectable()
export class UserAnalyticsRepository implements UserAnalyticsRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: UserAnalyticsMapper,
    ) { }

    /**
     * 생애 통계 조회
     */
    async getTotalStats(userId: bigint): Promise<UserGlobalTotalStats | null> {
        const stats = await this.tx.userGlobalTotalStats.findUnique({
            where: { userId },
        });
        return stats ? this.mapper.toTotalDomain(stats) : null;
    }

    /**
     * 시간별 통계 조회
     */
    async getHourlyStats(userId: bigint, date: Date): Promise<UserGlobalHourlyStats | null> {
        const utcHourStr = date.toISOString().substring(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00:00.000Z
        const hourKey = new Date(utcHourStr);
        const stats = await this.tx.userGlobalHourlyStats.findUnique({
            where: { hour_userId: { hour: hourKey, userId } },
        });
        return stats ? this.mapper.toHourlyDomain(stats) : null;
    }

    /**
     * [핵심] 원자적 통계 증감 업데이트 (Kysely 활용)
     * 
     * 단일 트랜잭션 내에서 Total과 Hourly 통계를 동시에 Upsert & Increment 합니다.
     */
    async increaseStats(dto: UpdateUserAnalyticsDto): Promise<void> {
        const { userId } = dto;
        const now = new Date();
        const inputDate = dto.date || now;
        const utcHourStr = inputDate.toISOString().substring(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00:00.000Z
        const hourKey = new Date(utcHourStr);

        const dUsd = dto.depositUsd?.toString() ?? '0';
        const wUsd = dto.withdrawUsd?.toString() ?? '0';
        const bUsd = dto.betUsd?.toString() ?? '0';
        const winUsd = dto.winUsd?.toString() ?? '0';
        const pUsd = dto.promoUsd?.toString() ?? '0';

        // 1. Total Stats Update
        await this.tx.$kysely
            .insertInto('user_global_total_stats')
            .values({
                user_id: userId.toString(),
                total_deposit_usd: dUsd,
                total_withdraw_usd: wUsd,
                total_bet_usd: bUsd,
                total_win_usd: winUsd,
                total_promo_usd: pUsd,
                // 유도 필드 (LTV = D - W, GGR = B - Win, NGR = GGR - Promo)
                ltv_usd: sql`CAST(${dUsd} AS NUMERIC) - CAST(${wUsd} AS NUMERIC)`,
                ggr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC)`,
                ngr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC) - CAST(${pUsd} AS NUMERIC)`,
                updated_at: now,
            })
            .onConflict((oc) =>
                oc.column('user_id').doUpdateSet({
                    total_deposit_usd: sql`user_global_total_stats.total_deposit_usd + CAST(${dUsd} AS NUMERIC)`,
                    total_withdraw_usd: sql`user_global_total_stats.total_withdraw_usd + CAST(${wUsd} AS NUMERIC)`,
                    total_bet_usd: sql`user_global_total_stats.total_bet_usd + CAST(${bUsd} AS NUMERIC)`,
                    total_win_usd: sql`user_global_total_stats.total_win_usd + CAST(${winUsd} AS NUMERIC)`,
                    total_promo_usd: sql`user_global_total_stats.total_promo_usd + CAST(${pUsd} AS NUMERIC)`,
                    // 누적 데이터 기반 LTV/GGR/NGR 재계산
                    ltv_usd: sql`user_global_total_stats.total_deposit_usd + CAST(${dUsd} AS NUMERIC) - (user_global_total_stats.total_withdraw_usd + CAST(${wUsd} AS NUMERIC))`,
                    ggr_usd: sql`user_global_total_stats.total_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_total_stats.total_win_usd + CAST(${winUsd} AS NUMERIC))`,
                    ngr_usd: sql`user_global_total_stats.total_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_total_stats.total_win_usd + CAST(${winUsd} AS NUMERIC)) - (user_global_total_stats.total_promo_usd + CAST(${pUsd} AS NUMERIC))`,
                    updated_at: now,
                }),
            )
            .execute();

        // 2. Hourly Stats Update
        await this.tx.$kysely
            .insertInto('user_global_hourly_stats')
            .values({
                hour: hourKey,
                user_id: userId.toString(),
                hourly_deposit_usd: dUsd,
                hourly_withdraw_usd: wUsd,
                hourly_bet_usd: bUsd,
                hourly_win_usd: winUsd,
                hourly_promo_usd: pUsd,
                // 해당 시간의 변동량 기반
                ltv_usd: sql`CAST(${dUsd} AS NUMERIC) - CAST(${wUsd} AS NUMERIC)`,
                ggr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC)`,
                ngr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC) - CAST(${pUsd} AS NUMERIC)`,
                updated_at: now,
            })
            .onConflict((oc) =>
                oc.columns(['hour', 'user_id']).doUpdateSet({
                    hourly_deposit_usd: sql`user_global_hourly_stats.hourly_deposit_usd + CAST(${dUsd} AS NUMERIC)`,
                    hourly_withdraw_usd: sql`user_global_hourly_stats.hourly_withdraw_usd + CAST(${wUsd} AS NUMERIC)`,
                    hourly_bet_usd: sql`user_global_hourly_stats.hourly_bet_usd + CAST(${bUsd} AS NUMERIC)`,
                    hourly_win_usd: sql`user_global_hourly_stats.hourly_win_usd + CAST(${winUsd} AS NUMERIC)`,
                    hourly_promo_usd: sql`user_global_hourly_stats.hourly_promo_usd + CAST(${pUsd} AS NUMERIC)`,
                    // 시간별 증가분 기반 KPI 재계산
                    ltv_usd: sql`user_global_hourly_stats.hourly_deposit_usd + CAST(${dUsd} AS NUMERIC) - (user_global_hourly_stats.hourly_withdraw_usd + CAST(${wUsd} AS NUMERIC))`,
                    ggr_usd: sql`user_global_hourly_stats.hourly_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_hourly_stats.hourly_win_usd + CAST(${winUsd} AS NUMERIC))`,
                    ngr_usd: sql`user_global_hourly_stats.hourly_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_hourly_stats.hourly_win_usd + CAST(${winUsd} AS NUMERIC)) - (user_global_hourly_stats.hourly_promo_usd + CAST(${pUsd} AS NUMERIC))`,
                    updated_at: now,
                }),
            )
            .execute();
    }
}
