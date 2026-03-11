import { Injectable, Logger, Inject } from '@nestjs/common';
import { type GameRoundRepositoryPort } from 'src/modules/casino/ports/game-round.repository.port';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/casino/ports/game-round.repository.token';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import { GameAggregatorType, Prisma } from '@prisma/client';
import { GameResultMeta } from 'src/modules/casino/domain/model/game-round.entity';
import { ClsService } from 'nestjs-cls';
import { CASINO_GAME_SESSION_REPOSITORY } from 'src/modules/casino-session/ports/casino-game-session.repository.token';
import { type CasinoGameSessionRepositoryPort } from 'src/modules/casino-session/ports/casino-game-session.repository.port';

import { DcsResponseCode } from '../constants/dcs-response-codes';

@Injectable()
export class DcsFetchGameResultService {
  private readonly logger = new Logger(DcsFetchGameResultService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    @Inject(CASINO_GAME_SESSION_REPOSITORY)
    private readonly gameSessionRepository: CasinoGameSessionRepositoryPort,
    private readonly dcsApiService: DcsApiService,
    private readonly cls: ClsService,
  ) { }

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

      if (round.aggregatorType !== GameAggregatorType.DC) {
        this.logger.warn(
          `Invalid aggregator type for round ${gameRoundId}: ${round.aggregatorType}`,
        );
        return;
      }

      const aggregatorRoundId = round.aggregatorRoundId;

      if (!aggregatorRoundId) {
        this.logger.warn(`No aggregator round ID for round ${gameRoundId}`);
        return;
      }

      try {
        // 세션 정보 조회 (brand_uid = playerName)
        const session = await this.gameSessionRepository.findByid(
          round.gameSessionId,
        );

        if (!session) {
          this.logger.warn(
            `CasinoGameSession not found for round ${gameRoundId}`,
          );
          return;
        }

        // DCS API 호출 (getReplay)
        const result = await this.dcsApiService.getReplay({
          brand_uid: session.playerName,
          gameCurrency: round.gameCurrency as any, // DcsApiService에서 GamingCurrencyCode 타입 캐스팅 필요
          provider: round.provider,
          round_id: aggregatorRoundId,
        });

        // 에러 응답 처리
        if (result.code !== DcsResponseCode.SUCCESS) {
          this.logger.warn(
            `Failed to fetch DCS game replay: ${result.msg} (Round: ${gameRoundId})`,
          );
          return;
        }

        if (!result.data || !result.data.record) {
          this.logger.log(`No replay record returned for round ${gameRoundId}`);
          return;
        }

        const { record, record_type } = result.data;
        let meta: GameResultMeta | null = null;

        // DCS record_type: 'Text' | 'URL' | 'Html'
        // GameResultMeta: { type: 'url' | 'text' | 'html', value: string }
        if (record_type === 'URL') {
          meta = { type: 'url', value: record };
        } else if (record_type === 'Html') {
          meta = { type: 'html', value: record };
        } else {
          // Default to text
          meta = { type: 'text', value: record };
        }

        if (meta) {
          // 직접 Repository의 updateResultMeta 호출하여 최적화
          await this.gameRoundRepository.updateResultMeta(
            round.id,
            round.startedAt,
            meta,
          );
          this.logger.log(
            `Updated game result metadata for round ${gameRoundId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error fetching DCS game result for round ${gameRoundId}`,
          error,
        );
        throw error; // Processor에서 재시도할 수 있도록 에러 전파
      }
    });
  }
}
