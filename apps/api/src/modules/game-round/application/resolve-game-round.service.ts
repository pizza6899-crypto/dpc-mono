import { Inject, Injectable, Logger } from '@nestjs/common';
import { GameProvider } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { GameRound } from '../domain/game-round.entity';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/game-round.repository.port';
import {
  InvalidGameRoundSessionException,
} from '../domain/game-round.exception';

export interface ResolveGameRoundCommand {
  session: CasinoGameSession;
  externalRoundId: string;
  triggerTime: Date;
  provider: GameProvider;
  isOrphaned?: boolean;
}

@Injectable()
export class ResolveGameRoundService {
  private readonly logger = new Logger(ResolveGameRoundService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 외부 라운드 ID 기반으로 기존 라운드를 찾고, 없으면 새로 생성하여 영속화합니다.
   */
  @Transactional()
  async execute(command: ResolveGameRoundCommand): Promise<GameRound> {
    const { session, externalRoundId, triggerTime, provider, isOrphaned } = command;

    // 1. 기존 라운드 조회 (윈도우 검색)
    let round = await this.gameRoundRepository.findByExternalIdWithWindow(
      externalRoundId,
      session.aggregatorType,
      triggerTime,
    );

    if (round) {
      return round;
    }

    // 2. 신규 라운드 생성
    const internalGameId = session.gameId;
    if (!internalGameId) {
      throw new InvalidGameRoundSessionException(session.id!);
    }

    const { id: newRoundId } = this.snowflakeService.generate(triggerTime);
    round = GameRound.create(
      newRoundId,
      session.userId,
      session.id!,
      internalGameId,
      provider,
      session.aggregatorType,
      externalRoundId,
      session.walletCurrency,
      session.gameCurrency,
      session.exchangeRate,
      session.usdExchangeRate,
      session.compRate,
      triggerTime,
      isOrphaned || false,
    );

    // 3. 영속화 및 반환
    await this.gameRoundRepository.save(round);
    this.logger.debug(
      `[ResolveGameRound] New round created: ID=${newRoundId}, External=${externalRoundId}`,
    );

    return round;
  }
}
