// src/modules/payment/application/crypto-deposit.service.ts
import { Injectable, Logger, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { NowPaymentApiService } from '../infrastructure/now-payment-api.service';
import { CreateDepositRequestDto } from '../dtos/create-deposit-request.dto';
import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
import {
  DepositDetailStatus,
  DepositMethodType,
  FeePaidByType,
  PaymentProvider,
  TransactionStatus,
  TransactionType,
} from '@repo/database';
import { nowUtcMinus } from 'src/utils/date.util';
import { IdUtil } from 'src/utils/id.util';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class CryptoDepositService {
  private readonly logger = new Logger(CryptoDepositService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly nowPaymentApiService: NowPaymentApiService,
    private readonly envService: EnvService,
  ) {}

  async createDeposit(
    userId: bigint,
    request: CreateDepositRequestDto,
    requestInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const { payCurrency, payNetwork } = request;

    // 활성화 여부 확인
    if (!this.envService.deposit.cryptoDepositEnabled) {
      throw new ApiException(
        MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Cryptocurrency deposit is currently disabled',
      );
    }

    // 허용된 통화 확인 (설정이 있으면 검증)
    const allowedCurrencies =
      this.envService.deposit.cryptoDepositAllowedCurrencies;
    if (
      allowedCurrencies.length > 0 &&
      !allowedCurrencies.includes(payCurrency)
    ) {
      throw new ApiException(
        MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
        HttpStatus.BAD_REQUEST,
        `Currency ${payCurrency} is not allowed for crypto deposit`,
      );
    }

    // 기존 대기 중인 인보이스 확인
    const existingInvoice = await this.prismaService.depositDetail.findFirst({
      where: {
        transaction: { userId },
        provider: PaymentProvider.NOWPAYMENT,
        status: DepositDetailStatus.PENDING,
        createdAt: { gte: nowUtcMinus({ minutes: 5 }) },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (existingInvoice) {
      this.logger.warn(
        `사용자 ${userId}가 이미 대기 중인 인보이스가 있습니다: ${existingInvoice.id}`,
      );
      throw new ApiException(
        MessageCode.DEPOSIT_REQUEST_ALREADY_EXISTS,
        HttpStatus.BAD_REQUEST,
        'There is already a pending deposit request being processed. Please try again later.',
      );
    }

    // NowPayment API 호출
    const paymentResponse = await this.nowPaymentApiService.createPayment(
      5, // TODO: 실제 입금 금액
      'USD', // TODO: 실제 가격 통화
      payCurrency,
      IdUtil.generateCryptoOrderId(),
    );

    // 사용자 잔액 확인
    const userBalance = await this.prismaService.userBalance.findUnique({
      where: { userId_currency: { userId, currency: payCurrency } },
      select: { mainBalance: true, bonusBalance: true },
    });

    if (!userBalance) {
      throw new ApiException(
        MessageCode.USER_BALANCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User balance not found',
      );
    }

    const beforeAmount = userBalance.mainBalance.add(userBalance.bonusBalance);

    // 거래 생성
    const transaction = await this.prismaService.transaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        currency: payCurrency,
        amount: 0,
        beforeAmount: beforeAmount,
        afterAmount: beforeAmount,
        depositDetail: {
          create: {
            status: DepositDetailStatus.PENDING,
            methodType: DepositMethodType.CRYPTO_WALLET,
            provider: PaymentProvider.NOWPAYMENT,
            providerPaymentId: paymentResponse.order_id,
            depositCurrency: payCurrency,
            depositNetwork: payNetwork,
            walletAddress: paymentResponse.pay_address,
            walletAddressExtraId: paymentResponse.payin_extra_id,
            feePaidBy: FeePaidByType.SYSTEM,
            providerMetadata: { ...paymentResponse },
          },
        },
      },
      select: { id: true },
    });

    this.logger.log(
      `암호화폐 입금 인보이스 생성 완료 - User: ${userId}, Transaction: ${transaction.id}`,
    );

    const result: CreateDepositResponseDto = {
      payAddress: paymentResponse.pay_address,
      payCurrency: paymentResponse.pay_currency,
      payAddressExtraId: paymentResponse.payin_extra_id,
      payNetwork: paymentResponse.network,
      transactionId: transaction.id.toString(),
    };

    return result;
  }
}
