// src/modules/payment/application/admin-deposit.service.ts
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma, DepositDetailStatus, TransactionStatus } from '@repo/database';
import { RollingService } from '../../rolling/application/rolling.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { GetDepositsQueryDto } from '../dtos/get-deposits-query.dto';
import {
  AdminDepositListItemDto,
  RejectDepositResponseDto,
} from '../dtos/admin-deposit-response.dto';
import { nowUtc } from 'src/utils/date.util';
import { UserStatsService } from 'src/modules/user-stats/application/user-stats.service';
import { WalletCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class AdminDepositService {
  private readonly logger = new Logger(AdminDepositService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly rollingService: RollingService,
    private readonly userStatsService: UserStatsService,
  ) {}

  /**
   * 입금 승인 처리
   */
  async approveDeposit(
    depositDetailId: bigint,
    actuallyPaid: Prisma.Decimal,
    transactionHash: string | undefined,
    memo: string | undefined,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        // 1. 입금 상세 조회 및 검증
        const depositDetail = await tx.depositDetail.findUnique({
          where: { id: depositDetailId },
          select: {
            status: true,
            depositCurrency: true,
            providerMetadata: true,
            transaction: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        });

        if (!depositDetail) {
          throw new ApiException(
            MessageCode.DEPOSIT_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        if (
          depositDetail.status !== DepositDetailStatus.PENDING &&
          depositDetail.status !== DepositDetailStatus.CONFIRMING
        ) {
          throw new ApiException(
            MessageCode.DEPOSIT_ALREADY_PROCESSED,
            HttpStatus.BAD_REQUEST,
          );
        }

        const { transaction, depositCurrency } = depositDetail;
        const userId = transaction.userId;

        // 2. 사용자 잔액 조회 또는 생성
        const userBalance = await tx.userBalance.upsert({
          where: {
            userId_currency: {
              userId,
              currency: depositCurrency,
            },
          },
          update: {},
          create: {
            userId,
            currency: depositCurrency,
            mainBalance: 0,
            bonusBalance: 0,
          },
          select: {
            mainBalance: true,
            bonusBalance: true,
          },
        });

        const beforeAmount = userBalance.mainBalance.add(
          userBalance.bonusBalance,
        );
        const afterAmount = beforeAmount.add(actuallyPaid);

        // 3. 프로모션 보너스 처리 (첫 입금인 경우)
        const bonusAmount = new Prisma.Decimal(0);
        const rollingCreated = false;

        // TODO: 프로모션 체크 로직 구현 시
        // if (isFirstDeposit) {
        //   const promotionResult = await this.promotionBonusService.grantPromotionBonus(...);
        //   bonusAmount = promotionResult.bonusAmount;
        //   rollingCreated = promotionResult.rollingCreated;
        // }

        // 4. 잔액 업데이트
        await tx.userBalance.update({
          where: {
            userId_currency: {
              userId,
              currency: depositCurrency,
            },
          },
          data: {
            mainBalance: { increment: actuallyPaid },
          },
        });

        // 4-1. 통계 업데이트
        await this.userStatsService.updateDepositStats(
          tx,
          userId,
          depositCurrency,
          actuallyPaid,
        );

        // 5. 기본 입금 롤링 생성 (프로모션 롤링이 없는 경우)
        if (!rollingCreated) {
          await this.rollingService.createDepositRolling(
            tx,
            userId,
            actuallyPaid,
            depositDetailId,
          );
        }

        // 6. Transaction 업데이트
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            amount: actuallyPaid,
            beforeAmount,
            afterAmount: afterAmount.add(bonusAmount), // 보너스 포함
          },
        });

        // 7. DepositDetail 업데이트
        await tx.depositDetail.update({
          where: { id: depositDetailId },
          data: {
            status: DepositDetailStatus.COMPLETED,
            actuallyPaid,
            transactionHash,
            confirmedAt: nowUtc(),
            providerMetadata: {
              ...((depositDetail.providerMetadata as object) || {}),
              approvedBy: adminId.toString(),
              approvedAt: nowUtc(),
              memo,
            },
          },
        });

        // 8. Activity Log 기록 (트랜잭션 외부에서)
        // 트랜잭션 내부에서 로그를 기록하면 트랜잭션이 롤백될 수 있으므로 외부에서 기록
        const logData = {
          userId: adminId,
          isAdmin: true,
          description: `입금 승인 완료 - Transaction: ${transaction.id}, 금액: ${actuallyPaid}`,
          metadata: {
            depositDetailId: depositDetailId.toString(),
            transactionId: transaction.id.toString(),
            userId, // 대상 사용자 ID
            depositCurrency, // 추가
            actuallyPaid: actuallyPaid.toString(),
            beforeAmount: beforeAmount.toString(), // 추가
            afterAmount: afterAmount.add(bonusAmount).toString(), // 추가
            transactionHash,
            memo,
            bonusAmount: bonusAmount.toString(),
          },
        };

        return {
          success: true,
          transactionId: transaction.id.toString(),
          actuallyPaid: actuallyPaid.toString(),
          bonusAmount: bonusAmount.toString(),
          logData, // 로그 데이터를 반환하여 트랜잭션 외부에서 기록
        };
      });

      // 트랜잭션 성공 후 Activity Log 기록

      return {
        success: result.success,
        transactionId: result.transactionId,
        actuallyPaid: result.actuallyPaid,
        bonusAmount: result.bonusAmount,
      };
    } catch (error) {
      // 실패 로그 기록
      throw error;
    }
  }

  /**
   * 입금 거부 처리
   */
  async rejectDeposit(
    depositDetailId: bigint,
    failureReason: string,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<RejectDepositResponseDto> {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        // 1. 입금 상세 조회 및 검증
        const depositDetail = await tx.depositDetail.findUnique({
          where: { id: depositDetailId },
          select: {
            status: true,
            transactionId: true,
            providerMetadata: true,
            transaction: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        });

        if (!depositDetail) {
          throw new ApiException(
            MessageCode.DEPOSIT_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        if (
          depositDetail.status !== DepositDetailStatus.PENDING &&
          depositDetail.status !== DepositDetailStatus.CONFIRMING
        ) {
          throw new ApiException(
            MessageCode.DEPOSIT_ALREADY_PROCESSED,
            HttpStatus.BAD_REQUEST,
          );
        }

        // 2. DepositDetail 상태 변경
        await tx.depositDetail.update({
          where: { id: depositDetailId },
          data: {
            status: DepositDetailStatus.REJECTED,
            failedAt: nowUtc(),
            failureReason: failureReason,
            providerMetadata: {
              ...((depositDetail.providerMetadata as object) || {}),
              rejectedBy: adminId.toString(),
              rejectedAt: new Date(),
              rejectionReason: failureReason,
            },
          },
        });

        // 3. Transaction 상태 변경
        await tx.transaction.update({
          where: { id: depositDetail.transactionId },
          data: {
            status: TransactionStatus.CANCELLED,
            amount: 0, // 거부 시 변동 없음
          },
        });

        // 로그 데이터 반환
        return {
          success: true,
          logData: {
            userId: adminId,
            isAdmin: true,
            description: `입금 거부 - Transaction: ${depositDetail.transactionId}, 사유: ${failureReason}`,
            metadata: {
              depositDetailId: depositDetailId.toString(),
              transactionId: depositDetail.transactionId.toString(),
              userId: depositDetail.transaction.userId,
              failureReason,
            },
          },
        };
      });

      return { success: true };
    } catch (error) {
      // 실패 로그 기록
      throw error;
    }
  }

  /**
   * 입금 목록 조회
   */
  async getDeposits(
    query: GetDepositsQueryDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminDepositListItemDto>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.DepositDetailWhereInput = {
        ...(filters.status && { status: filters.status }),
        ...(filters.methodType && { methodType: filters.methodType }),
        ...(filters.currency && { depositCurrency: filters.currency }),
        ...(filters.userId && {
          transaction: { userId: filters.userId },
        }),
        ...(filters.startDate &&
          filters.endDate && {
            createdAt: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }),
      };

      const orderBy: Prisma.DepositDetailOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [deposits, total] = await Promise.all([
        this.prismaService.depositDetail.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            status: true,
            methodType: true,
            provider: true,
            depositCurrency: true,
            createdAt: true,
            updatedAt: true,
            failureReason: true,
            transaction: {
              select: {
                user: {
                  select: {
                    id: true,
                    uid: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        this.prismaService.depositDetail.count({ where }),
      ]);

      return {
        data: deposits.map((deposit) => ({
          id: deposit.id.toString(),
          userId: deposit.transaction.user.id,
          userEmail: deposit.transaction.user.email ?? '',
          status: deposit.status,
          methodType: deposit.methodType,
          provider: deposit.provider,
          depositCurrency: deposit.depositCurrency,
          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt,
          failureReason: deposit.failureReason ?? '',
        })),
        page,
        limit,
        total,
      };
    } catch (error) {
      throw error;
    }
  }
}
