import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import {
  UserWalletStatsRepositoryPort,
  UpdateWalletStatsDto,
} from '../ports/out/user-wallet-stats.repository.port';
import { UserWalletTotalStats, UserWalletHourlyStats } from '../domain';
import { UserWalletStatsMapper } from './user-wallet-stats.mapper';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { sql } from 'kysely';

@Injectable()
export class UserWalletStatsRepository implements UserWalletStatsRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserWalletStatsMapper,
  ) {}

  // --- Basic CRUD (Port Implementation) ---

  async getTotalStats(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWalletTotalStats | null> {
    const stats = await this.tx.userWalletTotalStats.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    return stats ? this.mapper.toTotalDomain(stats) : null;
  }

  async saveTotalStats(stats: UserWalletTotalStats): Promise<void> {
    const data = this.mapper.toTotalPrisma(stats);
    await this.tx.userWalletTotalStats.upsert({
      where: {
        userId_currency: { userId: data.userId, currency: data.currency },
      },
      create: data,
      update: data,
    });
  }

  async getHourlyStats(
    userId: bigint,
    currency: ExchangeCurrencyCode,
    date: Date,
  ): Promise<UserWalletHourlyStats | null> {
    const stats = await this.tx.userWalletHourlyStats.findUnique({
      where: { date_userId_currency: { date, userId, currency } },
    });
    return stats ? this.mapper.toHourlyDomain(stats) : null;
  }

  async saveHourlyStats(stats: UserWalletHourlyStats): Promise<void> {
    const data = this.mapper.toHourlyPrisma(stats);
    await this.tx.userWalletHourlyStats.upsert({
      where: {
        date_userId_currency: {
          date: data.date,
          userId: data.userId,
          currency: data.currency,
        },
      },
      create: data,
      update: data,
    });
  }

  // --- Atomic Updates (Performance-based via Kysely) ---

  async increaseTotalStats(dto: UpdateWalletStatsDto): Promise<void> {
    const { userId, currency } = dto;
    const now = new Date();

    const depositCash = dto.depositCash?.toString() ?? '0';
    const withdrawCash = dto.withdrawCash?.toString() ?? '0';
    const betCash = dto.betCash?.toString() ?? '0';
    const winCash = dto.winCash?.toString() ?? '0';

    const depositUsd = dto.depositCashUsd?.toString() ?? '0';
    const withdrawUsd = dto.withdrawCashUsd?.toString() ?? '0';
    const betUsd = dto.betCashUsd?.toString() ?? '0';
    const winUsd = dto.winCashUsd?.toString() ?? '0';

    // Delta Calculation for Counts
    const getSign = (v: Prisma.Decimal | undefined) => {
      if (!v || v.isZero()) return 0;
      return v.isPositive() ? 1 : -1;
    };
    // Bet: Cash OR Bonus movement. Assume they move in same direction if both exist.
    const betCountDelta = getSign(dto.betCash) || getSign(dto.betBonus);
    const winCountDelta = getSign(dto.winCash) || getSign(dto.winBonus);

    // Recency Update Flags (Only update timestamp on NEW action, not rollback)
    const isNewBet = betCountDelta > 0;
    const isNewWin = winCountDelta > 0;
    const isNewDeposit = dto.depositCash && dto.depositCash.gt(0);
    const isNewWithdraw = dto.withdrawCash && dto.withdrawCash.gt(0);

    // Kysely Query Builder
    await this.tx.$kysely
      .insertInto('user_wallet_total_stats')
      .values({
        user_id: userId.toString(),
        currency: currency,
        total_deposit_cash: depositCash,
        total_withdraw_cash: withdrawCash,
        total_bet_cash: betCash,
        total_win_cash: winCash,
        total_bet_bonus: dto.betBonus?.toString() ?? '0',
        total_win_bonus: dto.winBonus?.toString() ?? '0',
        total_bonus_given: dto.bonusGiven?.toString() ?? '0',
        total_bonus_used: dto.bonusUsed?.toString() ?? '0',
        total_comp_earned: dto.compEarned?.toString() ?? '0',
        total_comp_used: dto.compUsed?.toString() ?? '0',
        total_vault_in: dto.vaultIn?.toString() ?? '0',
        total_vault_out: dto.vaultOut?.toString() ?? '0',
        total_deposit_cash_usd: depositUsd,
        total_withdraw_cash_usd: withdrawUsd,
        total_bet_cash_usd: betUsd,
        total_win_cash_usd: winUsd,
        max_bet_amount: betCash,
        max_win_amount: winCash,
        max_win_amount_usd: winUsd,
        total_bet_count: betCountDelta.toString(),
        total_win_count: winCountDelta.toString(),
        last_bet_at: isNewBet ? now : null,
        last_win_at: isNewWin ? now : null,
        last_deposit_at: isNewDeposit ? now : null,
        last_withdraw_at: isNewWithdraw ? now : null,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'currency']).doUpdateSet((eb) => ({
          total_deposit_cash: sql`user_wallet_total_stats.total_deposit_cash + ${depositCash}`,
          total_withdraw_cash: sql`user_wallet_total_stats.total_withdraw_cash + ${withdrawCash}`,
          total_bet_cash: sql`user_wallet_total_stats.total_bet_cash + ${betCash}`,
          total_win_cash: sql`user_wallet_total_stats.total_win_cash + ${winCash}`,
          total_bet_bonus: sql`user_wallet_total_stats.total_bet_bonus + ${dto.betBonus?.toString() ?? '0'}`,
          total_win_bonus: sql`user_wallet_total_stats.total_win_bonus + ${dto.winBonus?.toString() ?? '0'}`,
          total_bonus_given: sql`user_wallet_total_stats.total_bonus_given + ${dto.bonusGiven?.toString() ?? '0'}`,
          total_bonus_used: sql`user_wallet_total_stats.total_bonus_used + ${dto.bonusUsed?.toString() ?? '0'}`,
          total_comp_earned: sql`user_wallet_total_stats.total_comp_earned + ${dto.compEarned?.toString() ?? '0'}`,
          total_comp_used: sql`user_wallet_total_stats.total_comp_used + ${dto.compUsed?.toString() ?? '0'}`,
          total_vault_in: sql`user_wallet_total_stats.total_vault_in + ${dto.vaultIn?.toString() ?? '0'}`,
          total_vault_out: sql`user_wallet_total_stats.total_vault_out + ${dto.vaultOut?.toString() ?? '0'}`,

          total_deposit_cash_usd: sql`user_wallet_total_stats.total_deposit_cash_usd + ${depositUsd}`,
          total_withdraw_cash_usd: sql`user_wallet_total_stats.total_withdraw_cash_usd + ${withdrawUsd}`,
          total_bet_cash_usd: sql`user_wallet_total_stats.total_bet_cash_usd + ${betUsd}`,
          total_win_cash_usd: sql`user_wallet_total_stats.total_win_cash_usd + ${winUsd}`,

          max_bet_amount: sql`GREATEST(user_wallet_total_stats.max_bet_amount, ${betCash})`,
          max_win_amount: sql`GREATEST(user_wallet_total_stats.max_win_amount, ${winCash})`,
          max_win_amount_usd: sql`GREATEST(user_wallet_total_stats.max_win_amount_usd, ${winUsd})`,

          total_bet_count: sql`user_wallet_total_stats.total_bet_count + ${betCountDelta.toString()}`,
          total_win_count: sql`user_wallet_total_stats.total_win_count + ${winCountDelta.toString()}`,

          last_bet_at: isNewBet
            ? now
            : sql`user_wallet_total_stats.last_bet_at`,
          last_win_at: isNewWin
            ? now
            : sql`user_wallet_total_stats.last_win_at`,
          last_deposit_at: isNewDeposit
            ? now
            : sql`user_wallet_total_stats.last_deposit_at`,
          last_withdraw_at: isNewWithdraw
            ? now
            : sql`user_wallet_total_stats.last_withdraw_at`,

          updated_at: now,
        })),
      )
      .execute();
  }

  async updateHourlyStats(dto: UpdateWalletStatsDto): Promise<void> {
    const { userId, currency, currentBalance } = dto;
    const targetDate = dto.timestamp || new Date();
    const now = new Date();

    // Truncate to hour (UTC)
    // Note: Creating date object directly to ensure it matches DB storage
    const dateKey = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        targetDate.getUTCHours(),
        0,
        0,
      ),
    );

    const depositCash = dto.depositCash?.toString() ?? '0';
    const withdrawCash = dto.withdrawCash?.toString() ?? '0';
    const betCash = dto.betCash?.toString() ?? '0';
    const winCash = dto.winCash?.toString() ?? '0';

    const depositUsd = dto.depositCashUsd?.toString() ?? '0';
    const withdrawUsd = dto.withdrawCashUsd?.toString() ?? '0';
    const betUsd = dto.betCashUsd?.toString() ?? '0';
    const winUsd = dto.winCashUsd?.toString() ?? '0';

    // Delta Calculation for Counts
    const getSign = (v: Prisma.Decimal | undefined) => {
      if (!v || v.isZero()) return 0;
      return v.isPositive() ? 1 : -1;
    };
    const betCountDelta = getSign(dto.betCash) || getSign(dto.betBonus);
    const winCountDelta = getSign(dto.winCash) || getSign(dto.winBonus);

    const isNewBet = betCountDelta > 0;
    const isNewWin = winCountDelta > 0;
    const isNewDeposit = dto.depositCash && dto.depositCash.gt(0);
    const isNewWithdraw = dto.withdrawCash && dto.withdrawCash.gt(0);

    const currentCash = currentBalance?.cash.toString() ?? '0';
    const currentBonus = currentBalance?.bonus.toString() ?? '0';

    await this.tx.$kysely
      .insertInto('user_wallet_hourly_stats')
      .values({
        user_id: userId.toString(),
        currency: currency,
        date: dateKey,
        total_deposit_cash: depositCash,
        total_withdraw_cash: withdrawCash,
        total_bet_cash: betCash,
        total_win_cash: winCash,
        total_bet_bonus: dto.betBonus?.toString() ?? '0',
        total_win_bonus: dto.winBonus?.toString() ?? '0',
        total_bonus_given: dto.bonusGiven?.toString() ?? '0',
        total_bonus_used: dto.bonusUsed?.toString() ?? '0',
        total_deposit_cash_usd: depositUsd,
        total_withdraw_cash_usd: withdrawUsd,
        total_bet_cash_usd: betUsd,
        total_win_cash_usd: winUsd,
        max_bet_amount: betCash,
        max_win_amount: winCash,
        max_win_amount_usd: winUsd,
        total_bet_count: betCountDelta.toString(),
        total_win_count: winCountDelta.toString(),
        transaction_count: '1',
        last_bet_at: isNewBet ? now : null,
        last_win_at: isNewWin ? now : null,
        last_deposit_at: isNewDeposit ? now : null,
        last_withdraw_at: isNewWithdraw ? now : null,
        start_cash: currentCash,
        end_cash: currentCash,
        start_bonus: currentBonus,
        end_bonus: currentBonus,
        created_at: now,
      })
      .onConflict((oc) =>
        oc.columns(['date', 'user_id', 'currency']).doUpdateSet((eb) => ({
          total_deposit_cash: sql`user_wallet_hourly_stats.total_deposit_cash + ${depositCash}`,
          total_withdraw_cash: sql`user_wallet_hourly_stats.total_withdraw_cash + ${withdrawCash}`,
          total_bet_cash: sql`user_wallet_hourly_stats.total_bet_cash + ${betCash}`,
          total_win_cash: sql`user_wallet_hourly_stats.total_win_cash + ${winCash}`,
          total_bet_bonus: sql`user_wallet_hourly_stats.total_bet_bonus + ${dto.betBonus?.toString() ?? '0'}`,
          total_win_bonus: sql`user_wallet_hourly_stats.total_win_bonus + ${dto.winBonus?.toString() ?? '0'}`,
          total_bonus_given: sql`user_wallet_hourly_stats.total_bonus_given + ${dto.bonusGiven?.toString() ?? '0'}`,
          total_bonus_used: sql`user_wallet_hourly_stats.total_bonus_used + ${dto.bonusUsed?.toString() ?? '0'}`,

          total_deposit_cash_usd: sql`user_wallet_hourly_stats.total_deposit_cash_usd + ${depositUsd}`,
          total_withdraw_cash_usd: sql`user_wallet_hourly_stats.total_withdraw_cash_usd + ${withdrawUsd}`,
          total_bet_cash_usd: sql`user_wallet_hourly_stats.total_bet_cash_usd + ${betUsd}`,
          total_win_cash_usd: sql`user_wallet_hourly_stats.total_win_cash_usd + ${winUsd}`,

          max_bet_amount: sql`GREATEST(user_wallet_hourly_stats.max_bet_amount, ${betCash})`,
          max_win_amount: sql`GREATEST(user_wallet_hourly_stats.max_win_amount, ${winCash})`,
          max_win_amount_usd: sql`GREATEST(user_wallet_hourly_stats.max_win_amount_usd, ${winUsd})`,

          total_bet_count: sql`user_wallet_hourly_stats.total_bet_count + ${betCountDelta.toString()}`,
          total_win_count: sql`user_wallet_hourly_stats.total_win_count + ${winCountDelta.toString()}`,
          transaction_count: sql`user_wallet_hourly_stats.transaction_count + 1`,

          last_bet_at: isNewBet
            ? now
            : sql`user_wallet_hourly_stats.last_bet_at`,
          last_win_at: isNewWin
            ? now
            : sql`user_wallet_hourly_stats.last_win_at`,
          last_deposit_at: isNewDeposit
            ? now
            : sql`user_wallet_hourly_stats.last_deposit_at`,
          last_withdraw_at: isNewWithdraw
            ? now
            : sql`user_wallet_hourly_stats.last_withdraw_at`,

          end_cash: currentCash,
          end_bonus: currentBonus,
        })),
      )
      .execute();
  }
}
