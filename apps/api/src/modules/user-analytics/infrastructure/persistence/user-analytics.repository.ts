import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { sql } from 'kysely';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
    UserAnalyticsRepositoryPort,
    UpdateUserAnalyticsDto,
} from '../../ports/out/user-analytics.repository.port';
import { UserGlobalTotalStats, UserGlobalDailyStats } from '../../domain';
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
     * 일별 통계 조회
     */
    async getDailyStats(userId: bigint, date: Date): Promise<UserGlobalDailyStats | null> {
        const dateKey = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const stats = await this.tx.userGlobalDailyStats.findUnique({
            where: { date_userId: { date: dateKey, userId } },
        });
        return stats ? this.mapper.toDailyDomain(stats) : null;
    }

    /**
     * [핵심] 원자적 통계 증감 업데이트 (Kysely 활용)
     * 
     * 단일 트랜잭션 내에서 Total과 Daily 통계를 동시에 Upsert & Increment 합니다.
     */
    async increaseStats(dto: UpdateUserAnalyticsDto): Promise<void> {
        const { userId } = dto;
        const now = new Date();
        const inputDate = dto.date || now;
        const dateKey = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));

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

        // 2. Daily Stats Update
        await this.tx.$kysely
            .insertInto('user_global_daily_stats')
            .values({
                date: dateKey,
                user_id: userId.toString(),
                daily_deposit_usd: dUsd,
                daily_withdraw_usd: wUsd,
                daily_bet_usd: bUsd,
                daily_win_usd: winUsd,
                daily_promo_usd: pUsd,
                // 해당 날짜의 변동량 기반 (Daily 테이블은 누적이 아닌 해당 날짜 증가분임)
                ltv_usd: sql`CAST(${dUsd} AS NUMERIC) - CAST(${wUsd} AS NUMERIC)`,
                ggr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC)`,
                ngr_usd: sql`CAST(${bUsd} AS NUMERIC) - CAST(${winUsd} AS NUMERIC) - CAST(${pUsd} AS NUMERIC)`,
                updated_at: now,
            })
            .onConflict((oc) =>
                oc.columns(['date', 'user_id']).doUpdateSet({
                    daily_deposit_usd: sql`user_global_daily_stats.daily_deposit_usd + CAST(${dUsd} AS NUMERIC)`,
                    daily_withdraw_usd: sql`user_global_daily_stats.daily_withdraw_usd + CAST(${wUsd} AS NUMERIC)`,
                    daily_bet_usd: sql`user_global_daily_stats.daily_bet_usd + CAST(${bUsd} AS NUMERIC)`,
                    daily_win_usd: sql`user_global_daily_stats.daily_win_usd + CAST(${winUsd} AS NUMERIC)`,
                    daily_promo_usd: sql`user_global_daily_stats.daily_promo_usd + CAST(${pUsd} AS NUMERIC)`,
                    // 일별 증가분 기반 KPI 재계산
                    ltv_usd: sql`user_global_daily_stats.daily_deposit_usd + CAST(${dUsd} AS NUMERIC) - (user_global_daily_stats.daily_withdraw_usd + CAST(${wUsd} AS NUMERIC))`,
                    ggr_usd: sql`user_global_daily_stats.daily_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_daily_stats.daily_win_usd + CAST(${winUsd} AS NUMERIC))`,
                    ngr_usd: sql`user_global_daily_stats.daily_bet_usd + CAST(${bUsd} AS NUMERIC) - (user_global_daily_stats.daily_win_usd + CAST(${winUsd} AS NUMERIC)) - (user_global_daily_stats.daily_promo_usd + CAST(${pUsd} AS NUMERIC))`,
                    updated_at: now,
                }),
            )
            .execute();
    }
}
