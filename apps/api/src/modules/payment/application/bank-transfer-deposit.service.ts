// src/modules/payment/application/bank-transfer-deposit.service.ts
import { Injectable, Logger, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
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
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class BankTransferDepositService {
  private readonly logger = new Logger(BankTransferDepositService.name);

  constructor(
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
        }
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
        }
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
        }
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
                bankName: bankAccount?.bankName,
                accountNumber: bankAccount?.accountNumber,
                accountHolder: bankAccount?.accountHolder,
                depositorName: depositorName,
                feePaidBy: FeePaidByType.USER,
                providerMetadata: {
                  requestedAmount: amount,
                  currency: payCurrency,
                },
                bankAccountId: bankAccount?.id,
              },
            },
          },
          select: { id: true },
        });

        return {
          transactionId: transaction.id.toString(),
          bankName: bankAccount?.bankName,
          accountNumber: bankAccount?.accountNumber,
          accountHolder: bankAccount?.accountHolder,
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


      return response;
    } catch (error) {
      // 예상치 못한 에러에 대한 실패 로그 기록
      if (requestInfo && !(error instanceof ApiException)) {
      }
      throw error;
    }
  }
}
