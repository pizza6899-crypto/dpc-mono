import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
// import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
// import { GameAggregatorType, Prisma } from '@repo/database';
// import { CasinoBalanceService } from 'src/modules/casino/application/casino-balance.service';
// import { DcCallbackValidationException } from '../domain/validation.exception';
// import { DcCallbackException } from '../domain';

/**
 * DC 콜백 Exception Filter
 * DcCallbackException을 DCS 응답 형식으로 변환
 */
@Catch()
@Injectable()
export class DcCallbackExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DcCallbackExceptionFilter.name);

  constructor(
    // private readonly prismaService: PrismaService,
    // private readonly casinoBalanceService: CasinoBalanceService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // TODO: 나중에 수정 예정
    this.logger.error(
      `DC Callback 에러: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // 임시로 시스템 오류 응답
    return response.status(200).json(getDcsResponse(DcsResponseCode.SYSTEM_ERROR));

    /* 주석 처리된 기존 로직
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
    */
  }

  // TODO: 나중에 수정 예정 - getCurrentUserBalance 메서드
  // brand_uid로 현재 유저의 balance 조회 (환율 적용) 로직
}

