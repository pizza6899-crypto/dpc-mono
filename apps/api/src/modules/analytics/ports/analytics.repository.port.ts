import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { UserHourlyStat } from '../domain/model/user-hourly-stat.entity';

export interface AnalyticsRepositoryPort {
    /**
     * Find hourly stat by user, date, and currency
     * @param userId User ID
     * @param date Date (Hour precision)
     * @param currency Currency code
     */
    findByUserAndDate(
        userId: bigint,
        date: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat | null>;

    /**
     * Get hourly stat by user, date, and currency. 
     * Throws UserHourlyStatNotFoundException if not found.
     */
    getByUserAndDate(
        userId: bigint,
        date: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat>;

    /**
     * Create or update hourly stat
     * @param stat UserHourlyStat domain entity
     */
    save(stat: UserHourlyStat): Promise<UserHourlyStat>;

    /**
     * Find stats by user and date range
     */
    findStatsByUserAndPeriod(
        userId: bigint,
        startAt: Date,
        endAt: Date,
        currency?: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat[]>;
}
