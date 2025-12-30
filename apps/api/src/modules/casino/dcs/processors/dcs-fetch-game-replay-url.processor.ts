// src/modules/casino/dcs/processors/dcs-fetch-game-replay-url.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueNames,
  DcsFetchGameReplayUrlData,
} from 'src/infrastructure/queue/queue.types';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { HttpStatusCode } from 'axios';
import { GameReplayType } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Processor(QueueNames.DCS_FETCH_GAME_REPLAY_URL, {
  limiter: {
    max: 3,
    duration: 1000,
  },
})
export class DcsFetchGameReplayUrlProcessor
  extends WorkerHost
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(DcsFetchGameReplayUrlProcessor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly dcsApiService: DcsApiService,
  ) {
    super();
  }

  async process(job: Job<DcsFetchGameReplayUrlData>) {
    const { gameRoundId } = job.data;

    // 1. 게임 라운드 정보 조회
    const gameRound = await this.prismaService.gameRound.findUnique({
      where: {
        id: BigInt(gameRoundId),
      },
      select: {
        id: true,
        aggregatorTxId: true, // round_id
        replayType: true,
        replayData: true,
        provider: true,
        aggregatorType: true,
        userId: true,
        transaction: {
          select: {
            currency: true,
          },
        },
      },
    });

    if (!gameRound) {
      throw new Error(`게임 라운드를 찾을 수 없습니다: ${gameRoundId}`);
    }

    // 2. URL이 이미 존재하는지 확인
    if (gameRound.replayType && gameRound.replayData) {
      return {
        success: true,
      };
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: gameRound.userId,
      },
      select: {
        dcsId: true,
      },
    });

    // 3. DCS API로 리플레이 URL 조회
    const replayResponse = await this.dcsApiService.getReplay({
      brand_uid: user!.dcsId!,
      gameCurrency: gameRound.transaction.currency as GamingCurrencyCode,
      provider: gameRound.provider,
      round_id: gameRound.aggregatorTxId,
    });

    // 4. API 응답 검증
    if (replayResponse.code !== 1000) {
      this.logger.warn(
        `DCS API 응답 실패: code=${replayResponse.code}, ` +
          `gameRoundId=${gameRoundId}`,
      );

      throw new ApiException(
        MessageCode.NO_SUPPORT_GET_REPLAY,
        HttpStatusCode.BadRequest,
      );
    }

    // 5. URL 추출 및 검증
    const replayType = replayResponse.data?.record_type;
    const replayData = replayResponse.data?.record;

    let enumReplayType: GameReplayType;
    switch (replayType) {
      case 'Text':
        enumReplayType = GameReplayType.TEXT;
        break;
      case 'URL':
        enumReplayType = GameReplayType.URL;
        break;
      case 'Html':
        enumReplayType = GameReplayType.HTML;
        break;
      default:
        throw new Error('지원하지 않는 리플레이 타입입니다');
    }

    if (!replayType || !replayData) {
      this.logger.warn(
        `리플레이 데이터가 응답에 없음: gameRoundId=${gameRoundId}`,
      );
      throw new Error('리플레이 데이터가 응답에 없음');
    }

    // 6. DB에 리플레이 데이터 저장
    await this.prismaService.gameRound.update({
      where: {
        id: gameRound.id,
      },
      data: {
        replayType: enumReplayType,
        replayData: replayData,
      },
    });

    return {
      success: true,
    };
  }

  async onApplicationShutdown(signal?: string) {
    try {
      if (!this.worker) {
        return;
      }

      // 새로운 작업을 가져오지 않도록 중지
      // worker.close()는 자동으로 이를 처리하지만, 명시적으로 로깅
      await this.worker.close();

      this.logger.log(
        'DcsFetchGameReplayUrlProcessor가 정상적으로 종료되었습니다.',
      );
    } catch (error) {
      this.logger.error(
        'DcsFetchGameReplayUrlProcessor 종료 중 오류 발생',
        error,
      );
      // 에러가 발생해도 프로세스를 종료할 수 있도록 에러를 다시 throw하지 않음
    }
  }
}
