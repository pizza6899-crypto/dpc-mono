import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DcCallbackException,
  BalanceInsufficientException,
  BetRecordDuplicateException,
  SystemErrorException,
} from '../domain';
import { DcCallbackValidationException } from '../domain/validation.exception';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { GameAggregatorType, Prisma } from '@repo/database';
import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';

/**
 * DC 콜백 Exception Filter
 * DcCallbackException을 DCS 응답 형식으로 변환
 */
@Catch()
@Injectable()
export class DcCallbackExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DcCallbackExceptionFilter.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly casinoBalanceService: CasinoBalanceService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = request.body || {};
    const { brand_uid, currency } = body;

    // Guard에서 발생한 검증 에러 처리
    if (exception instanceof DcCallbackValidationException) {
      return response.status(200).json(exception.response);
    }

    // DC 콜백 예외 처리
    if (exception instanceof DcCallbackException) {
      this.logger.error(
        `DC Callback 에러: ${exception.constructor.name} - ${exception.message}`,
      );

      const balance = await this.getCurrentUserBalance(brand_uid, currency);

      if (brand_uid && currency) {
        return response.status(200).json(
          getDcsResponse(exception.responseCode, {
            brand_uid,
            currency,
            balance: balance ?? new Prisma.Decimal(0),
          }),
        );
      }

      return response.status(200).json(getDcsResponse(exception.responseCode));
    }

    // 알 수 없는 예외는 시스템 오류로 처리
    this.logger.error(
      `DC Callback 알 수 없는 에러: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const balance = await this.getCurrentUserBalance(brand_uid, currency);

    if (brand_uid && currency) {
      return response.status(200).json(
        getDcsResponse(DcsResponseCode.SYSTEM_ERROR, {
          brand_uid,
          currency,
          balance: balance ?? new Prisma.Decimal(0),
        }),
      );
    }

    return response.status(200).json(getDcsResponse(DcsResponseCode.SYSTEM_ERROR));
  }

  /**
   * brand_uid로 현재 유저의 balance 조회 (환율 적용)
   * Decimal(16,6) 형식으로 반환
   */
  private async getCurrentUserBalance(
    brandUid: string | undefined,
    currency: string | undefined,
  ): Promise<Prisma.Decimal | null> {
    if (!brandUid || !currency) {
      return null;
    }

    try {
      // 1. 사용자 조회
      const user = await this.prismaService.user.findUnique({
        where: { dcsId: brandUid },
        select: { id: true },
      });

      if (!user) {
        return null;
      }

      // 2. 최근 게임 세션 조회 (환율 정보)
      const gameSession = await this.prismaService.gameSession.findFirst({
        where: {
          userId: user.id,
          aggregatorType: GameAggregatorType.DCS,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          exchangeRate: true,
          walletCurrency: true,
        },
      });

      if (!gameSession) {
        return null;
      }

      // 3. 사용자 잔액 조회
      const userBalance =
        await this.casinoBalanceService.getUserCasinoBalance({
          userId: user.id,
          currency: gameSession.walletCurrency,
        });

      // 4. 환율 적용하여 게임 통화로 변환
      // Decimal(16,6) 형식: 전체 16자리, 소수점 이하 6자리
      const exchangeRateBalance = gameSession.exchangeRate.mul(
        userBalance.mainBalance.add(userBalance.bonusBalance),
      );

      // Decimal(16,6) 형식에 맞게 소수점 6자리로 제한
      const balance = exchangeRateBalance.toDecimalPlaces(6);

      return balance;
    } catch (error) {
      this.logger.warn(
        `Balance 조회 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}

