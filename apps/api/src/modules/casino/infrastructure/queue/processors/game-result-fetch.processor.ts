import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
    CasinoQueueNames,
    GameResultFetchData,
} from '../casino-queue.types';

/**
 * 게임 결과 조회 큐 정책
 */
export const GameResultFetchPolicy = {
    attempts: 10,
    delay: 5000,
    backoff: {
        type: 'fixed' as const,
        delay: 5000,
    },
    limiter: {
        max: 5,
        duration: 2000,
    },
};
import { ClsService } from 'nestjs-cls';
import { WhitecliffFetchGameResultService } from '../../../providers/whitecliff/application/whitecliff-fetch-game-result.service';
import { DcsFetchGameResultService } from '../../../providers/dcs/application/dcs-fetch-game-result.service';
import { GameAggregatorType } from '@prisma/client';

import { Inject } from '@nestjs/common';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../../../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../../../ports/out/game-round.repository.port';

import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Processor(CasinoQueueNames.GAME_RESULT_FETCH, {
    limiter: GameResultFetchPolicy.limiter,
})
export class GameResultFetchProcessor extends WorkerHost {
    private readonly logger = new Logger(GameResultFetchProcessor.name);

    constructor(
        private readonly dcsService: DcsFetchGameResultService,
        private readonly whitecliffService: WhitecliffFetchGameResultService,
        private readonly cls: ClsService,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
    ) {
        super();
    }

    async process(job: Job<GameResultFetchData>): Promise<void> {
        return this.cls.run(async () => {
            const { gameRoundId } = job.data;
            const roundId = BigInt(gameRoundId);

            // Snowflake ID에서 생성 시간(startedAt) 추출 (파티션 키)
            const { date: startedDate } = this.snowflakeService.parse(roundId);

            this.logger.log(`Processing GameResultFetch job for round ${gameRoundId}`);

            try {
                // DB에서 라운드 정보 조회
                const round = await this.gameRoundRepository.findById(roundId, startedDate);
                if (!round) {
                    this.logger.error(`GameRound not found: ${roundId}`);
                    return; // 라운드가 없으면 재시도하지 않고 종료 (영구 실패)
                }

                if (round.aggregatorType === GameAggregatorType.DC) {
                    await this.dcsService.execute(round.id, round.startedAt);
                } else if (round.aggregatorType === GameAggregatorType.WHITECLIFF) {
                    await this.whitecliffService.execute(round.id, round.startedAt);
                } else {
                    this.logger.warn(`Unknown aggregator type: ${round.aggregatorType}`);
                }
            } catch (error) {
                this.logger.error(
                    `Failed to fetch game result for round ${gameRoundId}`,
                    error,
                );
                throw error; // 재시도를 위해 에러 throw
            }
        });
    }
}
