import { UserWalletTotalStats, UserWalletHourlyStats } from '../../domain';
import { ExchangeCurrencyCode } from '@prisma/client';

export interface UserWalletStatsRepositoryPort {
    // Total Stats
    getTotalStats(userId: bigint, currency: ExchangeCurrencyCode): Promise<UserWalletTotalStats | null>;
    saveTotalStats(stats: UserWalletTotalStats): Promise<void>;

    // Hourly Stats
    getHourlyStats(userId: bigint, currency: ExchangeCurrencyCode, date: Date): Promise<UserWalletHourlyStats | null>;
    saveHourlyStats(stats: UserWalletHourlyStats): Promise<void>;

    // Aggregation support or Window queries could be added here
}
