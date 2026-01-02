// src/modules/deposit/infrastructure/deposit-detail.mapper.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import {
  DepositDetailStatus,
  ExchangeCurrencyCode,
  FeePaidByType,
} from '@repo/database';
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
    transactionId: bigint;
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
    bankConfigId: bigint | null;
    cryptoConfigId: bigint | null;
    processedBy: bigint | null;
    adminNote: string | null;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    failureReason: string | null;
    providerMetadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    failedAt: Date | null;
  }): DepositDetail {
    return DepositDetail.fromPersistence({
      id: prismaModel.id,
      uid: prismaModel.uid,
      transactionId: prismaModel.transactionId,
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
      bankConfigId: prismaModel.bankConfigId,
      cryptoConfigId: prismaModel.cryptoConfigId,
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
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환 (업데이트용)
   */
  toPrismaUpdate(domain: DepositDetail): {
    status: DepositDetailStatus;
    actuallyPaid: Prisma.Decimal | null;
    transactionHash: string | null;
    adminNote: string | null;
    processedBy: bigint | null;
    confirmedAt: Date | null;
    updatedAt: Date;
    failureReason?: string | null;
    failedAt?: Date | null;
  } {
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
    };
  }
}

