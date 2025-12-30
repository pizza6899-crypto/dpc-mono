// src/modules/payment/application/bank-transfer-deposit.service.ts
import { Injectable, Logger, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateDepositRequestDto } from '../dtos/create-deposit-request.dto';
import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
import {
  DepositDetailStatus,
  DepositMethodType,
  FeePaidByType,
  PaymentProvider,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@repo/database';
import { nowUtcMinus } from 'src/utils/date.util';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { ActivityType } from 'src/common/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class BankTransferDepositService {
  private readonly logger = new Logger(BankTransferDepositService.name);

  constructor(
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
    private readonly prismaService: PrismaService,
    private readonly envService: EnvService,
  ) {}

  async createDeposit(
    userId: bigint,
    request: CreateDepositRequestDto,
    requestInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const { payCurrency, amount, depositorName } = request;

    try {
      // 활성화 여부 확인
      if (!this.envService.deposit.bankTransferEnabled) {
        // 실패 로그 기록
        if (requestInfo) {
          await this.activityLog.logFailure(
            {
              userId,
              activityType: ActivityType.DEPOSIT_REQUEST,
              description: `무통장 입금 요청 실패 - 서비스 비활성화`,
              metadata: {
                payCurrency,
                amount,
                depositorName,
                reason: 'SERVICE_DISABLED',
              },
            },
            requestInfo,
          );
        }
        throw new ApiException(
          MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Bank transfer deposit is currently disabled',
        );
      }

      // 허용된 통화 확인
      const allowedCurrencies =
        this.envService.deposit.bankTransferAllowedCurrencies;
      if (
        allowedCurrencies.length > 0 &&
        !allowedCurrencies.includes(payCurrency)
      ) {
        // 실패 로그 기록
        if (requestInfo) {
          await this.activityLog.logFailure(
            {
              userId,
              activityType: ActivityType.DEPOSIT_REQUEST,
              description: `무통장 입금 요청 실패 - 지원하지 않는 통화: ${payCurrency}`,
              metadata: {
                payCurrency,
                amount,
                depositorName,
                reason: 'CURRENCY_NOT_ALLOWED',
                allowedCurrencies,
              },
            },
            requestInfo,
          );
        }
        throw new ApiException(
          MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          `Bank transfer deposit is not available for currency: ${payCurrency}`,
        );
      }

      // 기존 대기 중인 입금 요청 확인
      const existingDeposit = await this.prismaService.depositDetail.findFirst({
        where: {
          transaction: { userId },
          methodType: DepositMethodType.BANK_TRANSFER,
          provider: PaymentProvider.MANUAL,
          status: DepositDetailStatus.PENDING,
          createdAt: { gte: nowUtcMinus({ minutes: 15 }) },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionId: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
          depositCurrency: true,
          createdAt: true,
          transaction: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (existingDeposit) {
        // 실패 로그 기록
        if (requestInfo) {
          await this.activityLog.logFailure(
            {
              userId,
              activityType: ActivityType.DEPOSIT_REQUEST,
              description: `무통장 입금 요청 실패 - 중복 요청`,
              metadata: {
                payCurrency,
                amount,
                depositorName,
                reason: 'DUPLICATE_REQUEST',
                existingDepositId: existingDeposit.id.toString(),
              },
            },
            requestInfo,
          );
        }
        this.logger.warn(
          `사용자 ${userId}가 이미 대기 중인 무통장 입금 요청이 있습니다: ${existingDeposit.id}`,
        );

        // 기존 요청 정보 반환
        const existingResponse: CreateDepositResponseDto = {
          bankName: existingDeposit.bankName || undefined,
          accountNumber: existingDeposit.accountNumber || undefined,
          accountHolder: existingDeposit.accountHolder || undefined,
          transactionId: existingDeposit.transaction.id.toString(),
          isDuplicate: true, // 중복 요청임을 명시
        };

        // 성공 액티비티 로그 기록 (기존 요청 조회)
        if (requestInfo) {
          await this.activityLog.logSuccess(
            {
              userId,
              activityType: ActivityType.DEPOSIT_REQUEST,
              description: `무통장 입금 요청 - 기존 요청 반환 (중복 요청)`,
              metadata: {
                transactionId: existingDeposit.transaction.id.toString(),
                payCurrency: existingDeposit.depositCurrency,
                existingDepositId: existingDeposit.id.toString(),
                requestedAmount: amount,
                reason: 'DUPLICATE_REQUEST_RETURNED',
              },
            },
            requestInfo,
          );
        }

        return existingResponse;
      }

      // 은행 계좌 정보 가져오기
      const bankAccount = await this.prismaService.bankAccount.findFirst({
        where: {
          currency: payCurrency,
          isActive: true,
        },
        orderBy: { priority: 'desc' },
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
        },
      });

      if (!bankAccount) {
        // 실패 로그 기록
        if (requestInfo) {
          await this.activityLog.logFailure(
            {
              userId,
              activityType: ActivityType.DEPOSIT_REQUEST,
              description: `무통장 입금 요청 실패 - 사용 가능한 계좌 없음`,
              metadata: {
                payCurrency,
                amount,
                depositorName,
                reason: 'NO_BANK_ACCOUNT_AVAILABLE',
              },
            },
            requestInfo,
          );
        }
        throw new ApiException(
          MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Bank transfer deposit is currently disabled',
        );
      }

      // 거래 생성 - 명시적 트랜잭션 사용
      const result = await this.prismaService.$transaction(async (tx) => {
        // 사용자 잔액 조회 (트랜잭션 내에서 최신 상태 확인)
        const currentBalance = await tx.userBalance.findUnique({
          where: { userId_currency: { userId, currency: payCurrency } },
          select: { mainBalance: true, bonusBalance: true },
        });

        const beforeAmount = currentBalance
          ? currentBalance.mainBalance.add(currentBalance.bonusBalance)
          : new Prisma.Decimal(0);

        // 거래 생성
        const transaction = await tx.transaction.create({
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
                methodType: DepositMethodType.BANK_TRANSFER,
                provider: PaymentProvider.MANUAL,
                depositCurrency: payCurrency,
                bankName: bankAccount.bankName,
                accountNumber: bankAccount.accountNumber,
                accountHolder: bankAccount.accountHolder,
                depositorName: depositorName,
                feePaidBy: FeePaidByType.USER,
                providerMetadata: {
                  requestedAmount: amount,
                  currency: payCurrency,
                },
                bankAccountId: bankAccount.id,
              },
            },
          },
          select: { id: true },
        });

        return {
          transactionId: transaction.id.toString(),
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountHolder: bankAccount.accountHolder,
        };
      });

      this.logger.log(
        `무통장 입금 요청 생성 완료 - User: ${userId}, Transaction: ${result.transactionId}, Amount: ${amount}`,
      );

      const response: CreateDepositResponseDto = {
        bankName: result.bankName,
        accountNumber: result.accountNumber,
        accountHolder: result.accountHolder,
        transactionId: result.transactionId,
      };

      // 성공 액티비티 로그 기록
      if (requestInfo) {
        await this.activityLog.logSuccess(
          {
            userId,
            activityType: ActivityType.DEPOSIT_REQUEST,
            description: `무통장 입금 요청 생성 완료 - 통화: ${payCurrency}, 금액: ${amount}`,
            metadata: {
              transactionId: result.transactionId,
              payCurrency,
              amount,
              depositorName,
              bankName: result.bankName,
              accountNumber: result.accountNumber,
            },
          },
          requestInfo,
        );
      }

      return response;
    } catch (error) {
      // 예상치 못한 에러에 대한 실패 로그 기록
      if (requestInfo && !(error instanceof ApiException)) {
        await this.activityLog.logFailure(
          {
            userId,
            activityType: ActivityType.DEPOSIT_REQUEST,
            description: `무통장 입금 요청 실패 - 예상치 못한 에러`,
            metadata: {
              payCurrency,
              amount,
              depositorName,
              reason: 'UNEXPECTED_ERROR',
              error: error.message,
            },
          },
          requestInfo,
        );
      }
      throw error;
    }
  }
}
