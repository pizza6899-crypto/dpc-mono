import { Injectable, Logger, Inject } from '@nestjs/common';
import { type GameRoundRepositoryPort } from '../../../ports/game-round.repository.port';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../../../ports/game-round.repository.token';
import { WhitecliffApiService } from '../infrastructure/whitecliff-api.service';
import { GameAggregatorType } from '@prisma/client';
import { GameResultMeta } from '../../../domain/model/game-round.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class WhitecliffFetchGameResultService {
  private readonly logger = new Logger(WhitecliffFetchGameResultService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    private readonly whitecliffApiService: WhitecliffApiService,
    private readonly cls: ClsService,
  ) {}

  async execute(gameRoundId: bigint, startedAt: Date): Promise<void> {
    return this.cls.run(async () => {
      const round = await this.gameRoundRepository.findById(
        gameRoundId,
        startedAt,
      );

      if (!round) {
        this.logger.error(
          `GameRound not found: ${gameRoundId} (startedAt: ${startedAt})`,
        );
        return;
      }

      if (round.aggregatorType !== GameAggregatorType.WHITECLIFF) {
        this.logger.warn(
          `Invalid aggregator type for round ${gameRoundId}: ${round.aggregatorType}`,
        );
        return;
      }

      // Whitecliff는 보통 BET 트랜잭션 ID를 기준으로 결과를 조회하거나, 별도 라운드 ID를 사용함.
      const txnId = round.aggregatorRoundId;

      if (!txnId) {
        this.logger.warn(`No aggregator round ID for round ${gameRoundId}`);
        return;
      }

      try {
        // API 호출
        const result = await this.whitecliffApiService.getTransactionResults({
          gameCurrency: round.gameCurrency as any, // Whitecliff 지원 통화로 간주
          lang: 'EN', // TODO: 세션의 언어 정보를 가져올 수 있다면 그에 맞춰야 함
          provider: round.provider,
          txn_id: txnId,
        });

        // 에러 응답 처리
        if ('error' in result) {
          this.logger.warn(
            `Failed to fetch Whitecliff game result: ${result.error} (Round: ${gameRoundId})`,
          );
          return;
        }

        // 결과 URL 확인 및 업데이트
        if (result.url) {
          const meta: GameResultMeta = {
            type: 'url',
            value: result.url,
          };

          await this.gameRoundRepository.updateResultMeta(
            round.id,
            round.startedAt,
            meta,
          );

          this.logger.log(`Updated game result URL for round ${gameRoundId}`);
        } else {
          this.logger.log(`No result URL returned for round ${gameRoundId}`);
        }
      } catch (error) {
        this.logger.error(
          `Error fetching Whitecliff game result for round ${gameRoundId}`,
          error,
        );
        throw error; // Processor에서 재시도할 수 있도록 에러 전파
      }
    });
  }
}
