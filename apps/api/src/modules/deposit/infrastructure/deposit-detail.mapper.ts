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
    uid: string;
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
    providerPaymentId: string | null;
    transactionHash: string | null;
    bankDepositConfigId: bigint | null;
    cryptoDepositConfigId: bigint | null;
    promotionId: bigint | null;
    processedBy: bigint | null;
    adminNote: string | null;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    failureReason: string | null;
    providerMetadata: any;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    failedAt: Date | null;
    bankDepositConfig?: { bankName: string } | null;
  }): DepositDetail {
    return DepositDetail.fromPersistence({
      id: prismaModel.id,
      uid: prismaModel.uid,
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
      providerPaymentId: prismaModel.providerPaymentId,
      transactionHash: prismaModel.transactionHash,
      bankConfigId: prismaModel.bankDepositConfigId,
      cryptoConfigId: prismaModel.cryptoDepositConfigId,
      promotionId: prismaModel.promotionId,
      processedBy: prismaModel.processedBy,
      adminNote: prismaModel.adminNote,
      ipAddress: prismaModel.ipAddress,
      deviceFingerprint: prismaModel.deviceFingerprint,
      failureReason: prismaModel.failureReason,
      providerMetadata: prismaModel.providerMetadata,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      confirmedAt: prismaModel.confirmedAt,
      failedAt: prismaModel.failedAt,
      bankName: prismaModel.bankDepositConfig?.bankName,
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
      adminNote: persistence.adminNote,
      processedBy: persistence.processedBy,
      confirmedAt: persistence.confirmedAt,
      updatedAt: persistence.updatedAt,
      failureReason: persistence.failureReason,
      failedAt: persistence.failedAt,
      walletAddress: persistence.walletAddress,
      walletAddressExtraId: persistence.walletAddressExtraId,
      providerPaymentId: persistence.providerPaymentId,
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
      providerPaymentId: persistence.providerPaymentId,
      transactionHash: persistence.transactionHash,
      bankDepositConfigId: persistence.bankConfigId,
      cryptoDepositConfigId: persistence.cryptoConfigId,
      promotionId: persistence.promotionId,
      processedBy: persistence.processedBy,
      adminNote: persistence.adminNote,
      ipAddress: persistence.ipAddress,
      deviceFingerprint: persistence.deviceFingerprint,
      failureReason: persistence.failureReason,
      userId: persistence.userId,
      providerMetadata: persistence.providerMetadata ?? {},
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
      confirmedAt: persistence.confirmedAt,
      failedAt: persistence.failedAt,
    };
  }
}

