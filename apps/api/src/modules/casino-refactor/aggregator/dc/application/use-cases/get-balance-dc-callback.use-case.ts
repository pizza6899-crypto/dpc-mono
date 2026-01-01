import { Injectable, Logger } from '@nestjs/common';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  GetDcBalanceRequestDto,
  GetDcBalanceResponseDto,
} from '../../dtos/callback.dto';
import { GameAggregatorType } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { GameSessionService } from 'src/modules/casino-refactor/application/game-session.service';
import {
  PlayerNotFoundException,
  NotLoggedInException,
  DcCallbackException,
} from '../../domain';

@Injectable()
export class GetBalanceDcCallbackUseCase {
  private readonly logger = new Logger(GetBalanceDcCallbackUseCase.name);

  constructor(
    private readonly gameSessionService: GameSessionService,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Get Balance 콜백 (잔액 조회)
   */
  async execute(
    body: GetDcBalanceRequestDto,
  ): Promise<GetDcBalanceResponseDto> {
    const { brand_uid, token, currency } = body;
    let gameSession: Awaited<
      ReturnType<typeof this.gameSessionService.findByToken>
    > = null;

    try {
      gameSession = await this.gameSessionService.findByToken({
        aggregatorType: GameAggregatorType.DCS,
        token,
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Get Balance API - 게임 세션 존재하지 않음: ${brand_uid}`,
        );
        throw new PlayerNotFoundException(brand_uid);
      }

      // token 불일치
      // 토큰이 다른 유저꺼임
      if (gameSession.user.dcsId !== brand_uid) {
        this.logger.error(`❌ Get Balance API - 토큰 불일치: ${brand_uid}`);
        throw new NotLoggedInException(brand_uid);
      }

      const userBalance = await this.casinoBalanceService.getUserCasinoBalance({
        userId: gameSession.user.id,
        currency: gameSession.walletCurrency,
      });

      // getUserCasinoBalance는 잔액이 없으면 에러를 throw하므로 null 체크 불필요
      const exchangeRateBalance = gameSession.exchangeRate.mul(
        userBalance.mainBalance.add(userBalance.bonusBalance),
      );

      // Audit 로그 기록 (성공)
      await this.dispatchLogService.dispatch({
        type: LogType.ACTIVITY,
        data: {
          userId: gameSession.user.id.toString(),
          category: 'CASINO',
          action: 'GET_BALANCE',
          metadata: {
            aggregatorType: GameAggregatorType.DCS,
            currency,
            walletCurrency: gameSession.walletCurrency,
            balance: exchangeRateBalance.toString(),
            mainBalance: userBalance.mainBalance.toString(),
            bonusBalance: userBalance.bonusBalance.toString(),
            success: true,
          },
        },
      });

      return getDcsResponse(DcsResponseCode.SUCCESS, {
        brand_uid,
        currency,
        balance: exchangeRateBalance,
      });
    } catch (error) {
      this.logger.error(error, `Get Balance 콜백 실패`);

      // 도메인 예외인 경우
      if (error instanceof DcCallbackException) {
        // Audit 로그 기록 (실패)
        // gameSession이 있고 brand_uid가 일치하는 경우에만 로그 기록
        if (gameSession?.user.dcsId === brand_uid) {
          try {
            await this.dispatchLogService.dispatch({
              type: LogType.ACTIVITY,
              data: {
                userId: gameSession.user.id.toString(),
                category: 'CASINO',
                action: 'GET_BALANCE',
                metadata: {
                  aggregatorType: GameAggregatorType.DCS,
                  currency,
                  walletCurrency: gameSession.walletCurrency,
                  success: false,
                  errorMessage: error.message,
                  errorType: error.constructor.name,
                },
              },
            });
          } catch (logError) {
            // 로그 기록 실패는 무시
            this.logger.warn('Get Balance 실패 로그 기록 중 오류 발생', logError);
          }
        }

        // 도메인 예외의 responseCode를 사용하여 응답 생성
        return getDcsResponse(error.responseCode, {
          brand_uid,
          currency,
        });
      }

      // 기존 에러 처리 (하위 호환성)
      // Audit 로그 기록 (실패)
      if (gameSession?.user.dcsId === brand_uid) {
        try {
          await this.dispatchLogService.dispatch({
            type: LogType.ACTIVITY,
            data: {
              userId: gameSession.user.id.toString(),
              category: 'CASINO',
              action: 'GET_BALANCE',
              metadata: {
                aggregatorType: GameAggregatorType.DCS,
                currency,
                walletCurrency: gameSession.walletCurrency,
                success: false,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : 'Unknown',
              },
            },
          });
        } catch (logError) {
          // 로그 기록 실패는 무시
          this.logger.warn('Get Balance 실패 로그 기록 중 오류 발생', logError);
        }
      }

      // 기존 에러 메시지 기반 매핑
      switch (error.message) {
        case 'USER_BALANCE_NOT_FOUND':
          return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST, {
            brand_uid,
            currency,
          });
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR, {
            brand_uid,
            currency,
          });
      }
    }
  }
}

