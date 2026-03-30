// apps/api/src/modules/casino/providers/whitecliff/infrastructure/processors/whitecliff-pushed-bet-history.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import {
  PushedBetHistoryResponse,
  WhitecliffApiService,
} from '../whitecliff-api.service';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { nowUtcMinus } from 'src/utils/date.util';
import { WhitecliffMapperService } from '../whitecliff-mapper.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';
import { UpdatePushedBetService } from '../../../../application/update-pushed-bet.service';
import { GameAggregatorType, Prisma } from '@prisma/client';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import { EnvService } from 'src/infrastructure/env/env.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.CASINO.WHITECLIFF_HISTORY);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class WhitecliffPushedBetHistoryProcessor extends BaseProcessor<
  any,
  void
> {
  protected readonly logger = new Logger(
    WhitecliffPushedBetHistoryProcessor.name,
  );

  constructor(
    private readonly envService: EnvService,
    private readonly whitecliffApiService: WhitecliffApiService,
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly cacheService: CacheService,
    private readonly updatePushedBetService: UpdatePushedBetService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  protected async processJob(job: Job<any>): Promise<void> {
    const { name } = job;

    if (
      name === BULLMQ_QUEUES.CASINO.WHITECLIFF_HISTORY.repeatableJobs[0].name
    ) {
      await this.handleHistoryUpdate();
    }
  }

  private async handleHistoryUpdate() {
    this.logger.debug('Starting Whitecliff pushed bet history update...');

    const endDate =
      nowUtcMinus({ seconds: 30 }).toISOString().slice(0, -5) + 'Z';
    const endDateObj = new Date(endDate);

    const whitecliffConfigs = this.envService.whitecliff;

    for (const config of whitecliffConfigs) {
      if (!config.apiEnabled) continue;

      const gameCurrency =
        this.whitecliffMapperService.convertWhitecliffCurrencyToGamingCurrency(
          config.currency,
        );

      // Evolution Live Casino 게임들
      const liveCasinoProductIds =
        gameCurrency === 'KRW' ? [31] : gameCurrency === 'IDR' ? [29] : [1];

      for (const prdId of liveCasinoProductIds) {
        const lastProcessedTime = await this.getLastProcessedTime(
          gameCurrency,
          prdId,
        );
        const initialStartDate = lastProcessedTime
          ? new Date(lastProcessedTime)
          : nowUtcMinus({ minutes: 120 });

        const maxGapMs = 2 * 60 * 60 * 1000;
        const currentEnd = new Date(
          Math.min(initialStartDate.getTime() + maxGapMs, endDateObj.getTime()),
        );

        const startDateStr = initialStartDate.toISOString().slice(0, -5) + 'Z';
        const endDateStr = currentEnd.toISOString().slice(0, -5) + 'Z';

        const success = await this.processPushedBetHistoryForProduct({
          gameCurrency,
          prdId,
          startDate: startDateStr,
          endDate: endDateStr,
        });

        if (success) {
          await this.setLastProcessedTime(gameCurrency, prdId, endDateStr);
        }
      }
    }
  }

  private async processPushedBetHistoryForProduct({
    gameCurrency,
    prdId,
    startDate,
    endDate,
  }: {
    gameCurrency: GamingCurrencyCode;
    prdId: number;
    startDate: string;
    endDate: string;
  }): Promise<boolean> {
    try {
      const response = await this.whitecliffApiService.getPushedBetHistory({
        gameCurrency,
        prd_id: prdId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.status !== '1') return false;

      const pushedBetHistory = (
        response as PushedBetHistoryResponse
      ).data?.filter(
        (pushedBet) => pushedBet.total_pushed_amt > 0 || pushedBet.tie_amt > 0,
      );

      const pushedRoundIds = new Set<string>();
      if (pushedBetHistory && pushedBetHistory.length > 0) {
        for (const pushedBet of pushedBetHistory) {
          pushedRoundIds.add(pushedBet.txn_id);
          await this.updatePushedBetService.execute({
            aggregatorRoundId: pushedBet.txn_id,
            pushedAmountGame: new Prisma.Decimal(pushedBet.total_pushed_amt),
            tieAmountGame: new Prisma.Decimal(pushedBet.tie_amt || 0),
          });
        }
      }

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const pendingRounds = await this.tx.casinoGameRound.findMany({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          startedAt: { gte: startDateObj, lte: endDateObj },
          pushedBetCheckedAt: null,
        },
        select: { id: true, startedAt: true, aggregatorRoundId: true },
      });

      const roundsToMarkChecked = pendingRounds.filter(
        (r) => !pushedRoundIds.has(r.aggregatorRoundId),
      );

      if (roundsToMarkChecked.length > 0) {
        const checkedIds = roundsToMarkChecked.map((r) => r.id);
        await this.tx.casinoGameRound.updateMany({
          where: {
            id: { in: checkedIds },
            startedAt: { gte: startDateObj, lte: endDateObj },
          },
          data: { pushedBetCheckedAt: new Date() },
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        error,
        `Failed to process pushed bet history for product ${prdId}`,
      );
      return false;
    }
  }

  private async getLastProcessedTime(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
  ): Promise<string | null> {
    return await this.cacheService.get<string>(
      CACHE_CONFIG.CASINO.WHITECLIFF_PROCESSED_TIME(gameCurrency, prdId),
    );
  }

  private async setLastProcessedTime(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
    processedTime: string,
  ): Promise<void> {
    await this.cacheService.set(
      CACHE_CONFIG.CASINO.WHITECLIFF_PROCESSED_TIME(gameCurrency, prdId),
      processedTime,
    );
  }
}
