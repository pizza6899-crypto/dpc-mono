import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { NowPaymentApiService } from '../infrastructure/now-payment-api.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';

@Injectable()
export class WithdrawService {
  private readonly logger = new Logger(WithdrawService.name);

  constructor(
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
    private readonly prismaService: PrismaService,
    private readonly nowPaymentApiService: NowPaymentApiService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  // async createWithdraw(
  //   userId: string,
  //   createWithdrawRequest: CreateWithdrawRequestDto,
  // ): Promise<CreateWithdrawResponseDto> {
  //   const { amount, cryptoCurrency, address, addressExtraId } =
  //     createWithdrawRequest;

  //   // 사용자 레벨 동시성 제어로 중복 출금 요청 방지
  //   return await this.concurrencyService.withUserLock({
  //     userId,
  //     operation: 'withdraw_request_creation',
  //     options: {
  //       ttl: 30,
  //     },
  //     callback: async () => {
  //       try {
  //         // 사용자 정보 조회
  //         const user = await this.prismaService.user.findUnique({
  //           where: { id: userId },
  //           select: {
  //             id: true,
  //             balances: {
  //               select: {
  //                 mainBalance: true,
  //               },
  //             },
  //           },
  //         });

  //         if (!user) {
  //           throw new BadRequestException('사용자를 찾을 수 없습니다.');
  //         }

  //         if (!user.balances[0]) {
  //           throw new BadRequestException(
  //             '사용자 잔액 정보를 찾을 수 없습니다.',
  //           );
  //         }

  //         // 잔액 확인
  //         const userBalance = user.balances[0].mainBalance;
  //         if (userBalance.lt(amount)) {
  //           throw new BadRequestException('잔액이 부족합니다.');
  //         }

  //         // 기존에 처리 중인 출금 요청이 있는지 확인
  //         const existingWithdraw =
  //           await this.prismaService.transaction.findFirst({
  //             where: {
  //               userId,
  //               type: TransactionType.WITHDRAW,
  //               status: TransactionStatus.PENDING,
  //               createdAt: {
  //                 gte: nowUtcMinus({ minutes: 5 }),
  //               },
  //             },
  //             include: {
  //               withdrawDetail: true,
  //             },
  //           });

  //         if (existingWithdraw) {
  //           this.logger.warn(
  //             `사용자 ${userId}가 이미 처리 중인 출금 요청이 있습니다: ${existingWithdraw.id}`,
  //           );
  //           throw new BadRequestException(
  //             'There is already a pending withdrawal request. Please try again later.',
  //           );
  //         }

  //         const isValidAddress =
  //           await this.nowPaymentApiService.validateAddress(
  //             address,
  //             cryptoCurrency,
  //             addressExtraId,
  //           );

  //         if (!isValidAddress) {
  //           throw new BadRequestException('Invalid withdrawal address.');
  //         }

  //         // NowPayment API를 통한 출금 생성
  //         const withdrawResponse = await this.nowPaymentApiService.createPayout(
  //           {
  //             address,
  //             addressExtraId,
  //             fiat_amount: amount,
  //             fiat_currency: WALLET_CURRENCIES[0],
  //             crypto_currency: cryptoCurrency,
  //           },
  //         );

  //         const withdrawalDetail = withdrawResponse.withdrawals[0];

  //         if (withdrawalDetail.status !== WithdrawalStatus.CREATING) {
  //           throw new BadRequestException('Failed to create withdrawal');
  //         }

  //         // 데이터베이스 트랜잭션으로 출금 처리
  //         const result = await this.prismaService.$transaction(async (tx) => {
  //           // 현재 잔액 조회 (트랜잭션 내에서 최신 상태 확인)
  //           const currentBalance = await tx.userBalance.findUnique({
  //             where: {
  //               userId_currency: {
  //                 userId: user.id,
  //                 currency: WALLET_CURRENCIES[0],
  //               },
  //             },
  //             select: { mainBalance: true },
  //           });

  //           if (!currentBalance || currentBalance.mainBalance.lt(amount)) {
  //             throw new BadRequestException('Insufficient balance.');
  //           }

  //           // NowPayment 출금 레코드 생성
  //           const nowPaymentWithdrawal = await tx.nowPaymentWithdrawal.create({
  //             data: {
  //               userId: user.id,
  //               withdrawalId: withdrawalDetail.id,
  //               batchWithdrawalId: withdrawalDetail.batch_withdrawal_id,
  //               currency: withdrawalDetail.currency,
  //               address: withdrawalDetail.address,
  //               addressExtraId: withdrawalDetail.extra_id,
  //               amount: withdrawalDetail.amount,
  //               status:
  //                 withdrawalDetail.status.toUpperCase() as WithdrawalStatus,
  //               errorMessage: withdrawalDetail.error,
  //               txHash: withdrawalDetail.hash,
  //               feeAmount: withdrawalDetail.fee,
  //               feePaidBy: withdrawalDetail.fee_paid_by,
  //               payoutDescription: withdrawalDetail.payout_description,
  //               uniqueExternalId: withdrawalDetail.unique_external_id,
  //             },
  //           });

  //           // 잔액 차감 (잠금)
  //           await tx.userBalance.update({
  //             where: {
  //               userId_currency: {
  //                 userId: user.id,
  //                 currency: WALLET_CURRENCIES[0],
  //               },
  //             },
  //             data: {
  //               mainBalance: { decrement: amount },
  //               balanceLocked: { increment: amount },
  //             },
  //           });

  //           // 트랜잭션 레코드 생성 - 수정된 beforeAmount/afterAmount 계산
  //           const transaction = await tx.transaction.create({
  //             data: {
  //               userId: user.id,
  //               type: TransactionType.WITHDRAW,
  //               status: TransactionStatus.PENDING,
  //               currency: WALLET_CURRENCIES[0],
  //               amount: -amount,
  //               beforeAmount: currentBalance.mainBalance, // 차감 전 잔액
  //               afterAmount: currentBalance.mainBalance.sub(amount), // 차감 후 잔액
  //               withdrawDetail: {
  //                 create: {
  //                   requestedAmount: amount,
  //                   requestedCurrency: WALLET_CURRENCIES[0],
  //                   currency: withdrawalDetail.currency,
  //                   amount: withdrawalDetail.amount,
  //                   fee: withdrawalDetail.fee,
  //                   feePaidBy: withdrawalDetail.fee_paid_by,
  //                   status: WithdrawDetailStatus.PENDING,

  //                   nowPaymentWithdrawalId: nowPaymentWithdrawal.id,
  //                 },
  //               },
  //             },
  //           });

  //           return {
  //             transaction,
  //             withdrawalDetail,
  //           };
  //         });

  //         this.logger.log(
  //           `출금 요청 생성 완료 - 사용자: ${userId}, 금액: ${amount}, 출금 ID: ${withdrawResponse.id}`,
  //         );

  //         return {
  //           amount: Number(result.withdrawalDetail.amount),
  //           currency: result.withdrawalDetail.currency,
  //           address: result.withdrawalDetail.address,
  //         };
  //       } catch (error) {
  //         this.logger.error(
  //           `출금 요청 생성 실패 - 사용자: ${userId}, 오류: ${error.message}`,
  //         );
  //         throw error;
  //       }
  //     },
  //   });
  // }
}
