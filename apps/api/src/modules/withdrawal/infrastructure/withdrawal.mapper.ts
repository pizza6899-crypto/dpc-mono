import { Injectable } from '@nestjs/common';
import type {
  WithdrawalDetail as PrismaWithdrawalDetail,
  CryptoWithdrawConfig as PrismaCryptoWithdrawConfig,
  BankWithdrawConfig as PrismaBankWithdrawConfig,
  Prisma,
} from '@prisma/client';
import {
  WithdrawalDetail,
  CryptoWithdrawConfig,
  BankWithdrawConfig,
} from '../domain';

@Injectable()
export class WithdrawalMapper {
  // ===== WithdrawalDetail =====

  toDomain(prisma: PrismaWithdrawalDetail): WithdrawalDetail {
    return WithdrawalDetail.rehydrate(prisma.id, {
      userId: prisma.userId,
      methodType: prisma.methodType,
      status: prisma.status,
      processingMode: prisma.processingMode,
      currency: prisma.currency,
      requestedAmount: prisma.requestedAmount,
      netAmount: prisma.netAmount,
      feeAmount: prisma.feeAmount,
      feeCurrency: prisma.feeCurrency,
      feePaidBy: prisma.feePaidBy,
      network: prisma.network,
      walletAddress: prisma.walletAddress,
      walletAddressExtraId: prisma.walletAddressExtraId,
      transactionHash: prisma.transactionHash,
      bankName: prisma.bankName,
      accountNumber: prisma.accountNumber,
      accountHolder: prisma.accountHolder,
      provider: prisma.provider,
      providerWithdrawalId: prisma.providerWithdrawalId,
      providerMetadata:
        (prisma.providerMetadata as Record<string, unknown>) ?? {},
      processedBy: prisma.processedBy,
      adminNotes: prisma.adminNotes ?? [],
      failureReason: prisma.failureReason,
      ipAddress: prisma.ipAddress,
      deviceFingerprint: prisma.deviceFingerprint,
      appliedConfig: (prisma.appliedConfig as Record<string, unknown>) ?? {},
      transactionId: (prisma as any).transactionId ?? null,
      cryptoWithdrawConfigId: prisma.cryptoWithdrawConfigId,
      bankWithdrawConfigId: prisma.bankWithdrawConfigId,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      confirmedAt: prisma.confirmedAt,
      failedAt: prisma.failedAt,
      cancelledAt: prisma.cancelledAt,
    });
  }

  toPrismaCreate(domain: WithdrawalDetail) {
    return {
      id: domain.id,
      userId: domain.props.userId,
      methodType: domain.props.methodType,
      status: domain.props.status,
      processingMode: domain.props.processingMode,
      currency: domain.props.currency,
      requestedAmount: domain.props.requestedAmount,
      netAmount: domain.props.netAmount,
      feeAmount: domain.props.feeAmount,
      feeCurrency: domain.props.feeCurrency,
      feePaidBy: domain.props.feePaidBy,
      network: domain.props.network,
      walletAddress: domain.props.walletAddress,
      walletAddressExtraId: domain.props.walletAddressExtraId,
      transactionHash: domain.props.transactionHash,
      bankName: domain.props.bankName,
      accountNumber: domain.props.accountNumber,
      accountHolder: domain.props.accountHolder,
      provider: domain.props.provider,
      providerWithdrawalId: domain.props.providerWithdrawalId,
      providerMetadata: domain.props.providerMetadata as Prisma.InputJsonValue,
      processedBy: domain.props.processedBy,
      adminNotes: domain.props.adminNotes,
      failureReason: domain.props.failureReason,
      ipAddress: domain.props.ipAddress,
      deviceFingerprint: domain.props.deviceFingerprint,
      appliedConfig: domain.props.appliedConfig as Prisma.InputJsonValue,
      cryptoWithdrawConfigId: domain.props.cryptoWithdrawConfigId,
      bankWithdrawConfigId: domain.props.bankWithdrawConfigId,
      confirmedAt: domain.props.confirmedAt,
      failedAt: domain.props.failedAt,
      cancelledAt: domain.props.cancelledAt,
    };
  }

  // ===== CryptoWithdrawConfig =====
  toPrismaCryptoConfig(domain: CryptoWithdrawConfig) {
    return {
      id: domain.id,
      symbol: domain.props.symbol,
      network: domain.props.network,
      isActive: domain.props.isActive,
      minWithdrawAmount: domain.props.minWithdrawAmount,
      maxWithdrawAmount: domain.props.maxWithdrawAmount,
      autoProcessLimit: domain.props.autoProcessLimit,
      withdrawFeeFixed: domain.props.withdrawFeeFixed,
      withdrawFeeRate: domain.props.withdrawFeeRate,
      createdAt: domain.props.createdAt,
      updatedAt: domain.props.updatedAt,
      deletedAt: domain.props.deletedAt,
    };
  }

  cryptoConfigToDomain(
    prisma: PrismaCryptoWithdrawConfig,
  ): CryptoWithdrawConfig {
    return CryptoWithdrawConfig.rehydrate(prisma.id, {
      symbol: prisma.symbol,
      network: prisma.network,
      isActive: prisma.isActive,
      minWithdrawAmount: prisma.minWithdrawAmount,
      maxWithdrawAmount: prisma.maxWithdrawAmount,
      autoProcessLimit: prisma.autoProcessLimit,
      withdrawFeeFixed: prisma.withdrawFeeFixed,
      withdrawFeeRate: prisma.withdrawFeeRate,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      deletedAt: prisma.deletedAt,
    });
  }

  // ===== BankWithdrawConfig =====

  toPrismaBankConfig(domain: BankWithdrawConfig) {
    return {
      id: domain.id,
      currency: domain.props.currency,
      bankName: domain.props.bankName,
      isActive: domain.props.isActive,
      minWithdrawAmount: domain.props.minWithdrawAmount,
      maxWithdrawAmount: domain.props.maxWithdrawAmount,
      withdrawFeeFixed: domain.props.withdrawFeeFixed,
      withdrawFeeRate: domain.props.withdrawFeeRate,
      description: domain.props.description,
      notes: domain.props.notes,
      createdAt: domain.props.createdAt,
      updatedAt: domain.props.updatedAt,
      deletedAt: domain.props.deletedAt,
    };
  }

  bankConfigToDomain(prisma: PrismaBankWithdrawConfig): BankWithdrawConfig {
    return BankWithdrawConfig.rehydrate(prisma.id, {
      currency: prisma.currency,
      bankName: prisma.bankName,
      isActive: prisma.isActive,
      minWithdrawAmount: prisma.minWithdrawAmount,
      maxWithdrawAmount: prisma.maxWithdrawAmount,
      withdrawFeeFixed: prisma.withdrawFeeFixed,
      withdrawFeeRate: prisma.withdrawFeeRate,
      description: prisma.description,
      notes: prisma.notes,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      deletedAt: prisma.deletedAt,
    });
  }
}
