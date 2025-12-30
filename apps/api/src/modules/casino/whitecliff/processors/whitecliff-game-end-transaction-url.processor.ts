import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueNames,
  WhitecliffFetchGameResultUrlData,
} from '../../../../common/queue/queue.types';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  TransactionResultsResponse,
  WhitecliffApiService,
} from 'src/modules/casino/whitecliff/infrastructure/whitecliff-api.service';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { GameReplayType, Language } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Processor(QueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL)
export class WhitecliffFetchGameResultUrlProcessor
  extends WorkerHost
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(
    WhitecliffFetchGameResultUrlProcessor.name,
  );

  constructor(
    private readonly prismaService: PrismaService,
    private readonly whitecliffApiService: WhitecliffApiService,
  ) {
    super();
  }

  async process(job: Job<WhitecliffFetchGameResultUrlData>) {
    const { gameRoundId } = job.data;

    // 1. 게임 트랜잭션 정보 조회
    const gameRound = await this.prismaService.gameRound.findUnique({
      where: {
        id: BigInt(gameRoundId),
      },
      select: {
        id: true,
        aggregatorTxId: true,
        replayType: true,
        replayData: true,
        provider: true,
        aggregatorType: true,
        GameSession: {
          select: {
            gameCurrency: true,
          },
        },
      },
    });

    if (!gameRound) {
      throw new Error(`게임 라운드를 찾을 수 없습니다: ${gameRoundId}`);
    }

    // 2. URL이 이미 존재하는지 확인
    if (
      (gameRound.replayType && gameRound.replayData) ||
      !gameRound.GameSession
    ) {
      return {
        success: true,
      };
    }

    const transactionResults =
      await this.whitecliffApiService.getTransactionResults({
        gameCurrency: gameRound.GameSession.gameCurrency as GamingCurrencyCode,
        lang: Language.KO,
        provider: gameRound.provider,
        txn_id: gameRound.aggregatorTxId,
      });

    // 4. API 응답 검증
    if (transactionResults.status !== 1) {
      this.logger.warn(
        `Whitecliff API 응답 실패: status=${transactionResults.status}, ` +
          `gameRoundId=${gameRoundId}`,
      );

      throw new Error(`API 응답 실패: status=${transactionResults.status}`);
    }

    // 5. URL 추출 및 검증
    const url = (transactionResults as TransactionResultsResponse).url;
    if (!url) {
      this.logger.warn(`URL이 응답에 없음: gameRoundId=${gameRoundId}`);
      throw new Error('URL이 응답에 없음');
    }

    await this.prismaService.gameRound.update({
      where: {
        id: gameRound.id,
      },
      data: {
        replayType: GameReplayType.URL,
        replayData: url,
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
        'WhitecliffFetchGameResultUrlProcessor가 정상적으로 종료되었습니다.',
      );
    } catch (error) {
      this.logger.error(
        'WhitecliffFetchGameResultUrlProcessor 종료 중 오류 발생',
        error,
      );
      // 에러가 발생해도 프로세스를 종료할 수 있도록 에러를 다시 throw하지 않음
    }
  }
}
