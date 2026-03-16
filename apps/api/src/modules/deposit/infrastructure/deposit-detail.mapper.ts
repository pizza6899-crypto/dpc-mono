// src/modules/deposit/infrastructure/deposit-detail.mapper.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DepositDetailStatus,
  ExchangeCurrencyCode,
  FeePaidByType,
} from '@prisma/client';
import { DepositDetail } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class DepositDetailMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: bigint;
    userId: bigint;
    transactionId?: bigint | null;
    status: DepositDetailStatus;
    methodType: any;
    provider: any;
    requestedAmount: Prisma.Decimal;
    actuallyPaid: Prisma.Decimal | null;
    feeAmount: Prisma.Decimal | null;
    feeCurrency: string | null;
    feePaidBy: FeePaidByType | null;
    depositCurrency: ExchangeCurrencyCode;
    walletAddress: string | null;
    walletAddressExtraId: string | null;
    depositNetwork: string | null;
    depositorName: string | null;
    depositorBank: string | null;
    depositorAccount: string | null;
    providerPaymentId: string | null;
    transactionHash: string | null;
    processedBy: bigint | null;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    appliedQuestId?: bigint | null;
    promotionSnapshot?: any;
    providerMetadata: any;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    failedAt: Date | null;
  }): DepositDetail {
    return DepositDetail.fromPersistence({
      id: prismaModel.id,
      userId: prismaModel.userId,
      transactionId: prismaModel.transactionId ?? null,
      status: prismaModel.status,
      methodType: prismaModel.methodType,
      provider: prismaModel.provider,
      requestedAmount: prismaModel.requestedAmount,
      actuallyPaid: prismaModel.actuallyPaid,
      feeAmount: prismaModel.feeAmount,
      feeCurrency: prismaModel.feeCurrency,
      feePaidBy: prismaModel.feePaidBy,
      depositCurrency: prismaModel.depositCurrency,
      walletAddress: prismaModel.walletAddress,
      walletAddressExtraId: prismaModel.walletAddressExtraId,
      depositNetwork: prismaModel.depositNetwork,
      depositorName: prismaModel.depositorName,
      depositorBank: prismaModel.depositorBank,
      depositorAccount: prismaModel.depositorAccount,
      providerPaymentId: prismaModel.providerPaymentId,
      transactionHash: prismaModel.transactionHash,
      processedBy: prismaModel.processedBy,
      ipAddress: prismaModel.ipAddress,
      deviceFingerprint: prismaModel.deviceFingerprint,
      appliedQuestId: prismaModel.appliedQuestId ?? null,
      promotionSnapshot: prismaModel.promotionSnapshot ?? null,
      providerMetadata: prismaModel.providerMetadata,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      confirmedAt: prismaModel.confirmedAt,
      failedAt: prismaModel.failedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환 (업데이트용)
   */
  toPrismaUpdate(domain: DepositDetail): any {
    const persistence = domain.toPersistence();
    return {
      status: persistence.status,
      actuallyPaid: persistence.actuallyPaid,
      transactionHash: persistence.transactionHash,
      processedBy: persistence.processedBy,
      confirmedAt: persistence.confirmedAt,
      updatedAt: persistence.updatedAt,
      failedAt: persistence.failedAt,
      walletAddress: persistence.walletAddress,
      walletAddressExtraId: persistence.walletAddressExtraId,
      providerPaymentId: persistence.providerPaymentId,
      appliedQuestId: persistence.appliedQuestId,
      promotionSnapshot: persistence.promotionSnapshot,
    };
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환 (생성용)
   */
  toPrismaCreate(domain: DepositDetail): any {
    const persistence = domain.toPersistence();
    return {
      status: persistence.status,
      methodType: persistence.methodType,
      provider: persistence.provider,
      requestedAmount: persistence.requestedAmount,
      actuallyPaid: persistence.actuallyPaid,
      feeAmount: persistence.feeAmount,
      feeCurrency: persistence.feeCurrency,
      feePaidBy: persistence.feePaidBy,
      depositCurrency: persistence.depositCurrency,
      walletAddress: persistence.walletAddress,
      walletAddressExtraId: persistence.walletAddressExtraId,
      depositNetwork: persistence.depositNetwork,
      depositorName: persistence.depositorName,
      depositorBank: persistence.depositorBank,
      depositorAccount: persistence.depositorAccount,
      providerPaymentId: persistence.providerPaymentId,
      transactionHash: persistence.transactionHash,
      processedBy: persistence.processedBy,
      ipAddress: persistence.ipAddress,
      deviceFingerprint: persistence.deviceFingerprint,
      userId: persistence.userId,
      appliedQuestId: persistence.appliedQuestId,
      promotionSnapshot: persistence.promotionSnapshot ?? {},
      providerMetadata: persistence.providerMetadata ?? {},
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
      confirmedAt: persistence.confirmedAt,
      failedAt: persistence.failedAt,
    };
  }
}
