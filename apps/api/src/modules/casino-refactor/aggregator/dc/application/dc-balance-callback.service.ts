import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import {
  GetDcBalanceRequestDto,
  GetDcBalanceResponseDto,
} from '../dtos/callback.dto';
import { GameAggregatorType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

@Injectable()
export class DcBalanceCallbackService {
  private readonly logger = new Logger(DcBalanceCallbackService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  /**
   * Get Balance 콜백 (잔액 조회)
   */
  async getBalance(
    body: GetDcBalanceRequestDto,
  ): Promise<GetDcBalanceResponseDto> {
    const { brand_uid, token, currency } = body;
    try {
      const gameSession = await this.prismaService.gameSession.findFirst({
        where: {
          aggregatorType: GameAggregatorType.DCS,
          token: token,
        },
        select: {
          id: true,
          exchangeRate: true,
          walletCurrency: true,
          user: {
            select: {
              id: true,
              dcsId: true,
            },
          },
        },
      });

      if (!gameSession) {
        this.logger.error(
          `❌ Get Balance API - 게임 세션 존재하지 않음: ${brand_uid}`,
        );
        return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
      }

      // token 불일치
      // 토큰이 다른 유저꺼임
      if (gameSession.user.dcsId !== brand_uid) {
        this.logger.error(`❌ Get Balance API - 토큰 불일치: ${brand_uid}`);
        return getDcsResponse(DcsResponseCode.NOT_LOGGED_IN);
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

      // Audit 로그 기록 (실패)
      // gameSession이 있는 경우에만 로그 기록
      try {
        const gameSession = await this.prismaService.gameSession.findFirst({
          where: {
            aggregatorType: GameAggregatorType.DCS,
            token: token,
          },
          select: {
            user: {
              select: {
                id: true,
                dcsId: true,
              },
            },
            walletCurrency: true,
          },
        });

        if (gameSession && gameSession.user.dcsId === brand_uid) {
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
        }
      } catch (logError) {
        // 로그 기록 실패는 무시
        this.logger.warn('Get Balance 실패 로그 기록 중 오류 발생', logError);
      }

      switch (error.message) {
        case 'USER_BALANCE_NOT_FOUND':
          return getDcsResponse(DcsResponseCode.PLAYER_NOT_EXIST);
        default:
          return getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
      }
    }
  }
}

