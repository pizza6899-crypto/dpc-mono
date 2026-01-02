// src/modules/deposit/domain/model/deposit-detail.entity.ts
import { Prisma } from '@repo/database';
import {
  DepositDetailStatus,
  ExchangeCurrencyCode,
  FeePaidByType,
} from '@repo/database';
import { DepositMethod } from './value-objects/deposit-method.vo';
import { DepositAmount } from './value-objects/deposit-amount.vo';

/**
 * DepositDetail 도메인 엔티티
 *
 * 입금 상세 정보를 표현하는 도메인 엔티티입니다.
 * - 암호화폐 지갑 입금 및 계좌 이체 입금 지원
 * - 입금 상태 추적 (대기, 확인 중, 완료, 실패 등)
 * - 프로바이더별 입금 정보 관리
 * - 신청 금액과 실제 입금 금액 분리 추적
 * - 관리자 수동 처리 추적
 * - 보안 및 어뷰징 방지
 */
export class DepositDetail {
  private constructor(
    public readonly id: bigint,
    public readonly uid: string,
    public readonly transactionId: bigint,
    private _status: DepositDetailStatus,
    private method: DepositMethod,
    private amount: DepositAmount,
    public readonly depositCurrency: ExchangeCurrencyCode,
    public readonly walletAddress: string | null,
    public readonly walletAddressExtraId: string | null,
    public readonly depositNetwork: string | null,
    public readonly depositorName: string | null,
    public readonly providerPaymentId: string | null,
    public readonly transactionHash: string | null,
    public readonly bankConfigId: bigint | null,
    public readonly cryptoConfigId: bigint | null,
    public readonly processedBy: bigint | null,
    public readonly adminNote: string | null,
    public readonly ipAddress: string | null,
    public readonly deviceFingerprint: string | null,
    public readonly failureReason: string | null,
    public readonly providerMetadata: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly confirmedAt: Date | null,
    public readonly failedAt: Date | null,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
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
    return new DepositDetail(
      data.id,
      data.uid,
      data.transactionId,
      data.status,
      DepositMethod.fromPersistence({
        methodType: data.methodType,
        provider: data.provider,
      }),
      DepositAmount.fromPersistence({
        requestedAmount: data.requestedAmount,
        actuallyPaid: data.actuallyPaid,
        feeAmount: data.feeAmount,
        feeCurrency: data.feeCurrency,
        feePaidBy: data.feePaidBy,
      }),
      data.depositCurrency,
      data.walletAddress,
      data.walletAddressExtraId,
      data.depositNetwork,
      data.depositorName,
      data.providerPaymentId,
      data.transactionHash,
      data.bankConfigId,
      data.cryptoConfigId,
      data.processedBy,
      data.adminNote,
      data.ipAddress,
      data.deviceFingerprint,
      data.failureReason,
      data.providerMetadata,
      data.createdAt,
      data.updatedAt,
      data.confirmedAt,
      data.failedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
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
  } {
    const methodData = this.method.toPersistence();
    const amountData = this.amount.toPersistence();

    return {
      id: this.id,
      uid: this.uid,
      transactionId: this.transactionId,
      status: this._status,
      methodType: methodData.methodType,
      provider: methodData.provider,
      requestedAmount: amountData.requestedAmount,
      actuallyPaid: amountData.actuallyPaid,
      feeAmount: amountData.feeAmount,
      feeCurrency: amountData.feeCurrency,
      feePaidBy: amountData.feePaidBy,
      depositCurrency: this.depositCurrency,
      walletAddress: this.walletAddress,
      walletAddressExtraId: this.walletAddressExtraId,
      depositNetwork: this.depositNetwork,
      depositorName: this.depositorName,
      providerPaymentId: this.providerPaymentId,
      transactionHash: this.transactionHash,
      bankConfigId: this.bankConfigId,
      cryptoConfigId: this.cryptoConfigId,
      processedBy: this.processedBy,
      adminNote: this.adminNote,
      ipAddress: this.ipAddress,
      deviceFingerprint: this.deviceFingerprint,
      failureReason: this.failureReason,
      providerMetadata: this.providerMetadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      confirmedAt: this.confirmedAt,
      failedAt: this.failedAt,
    };
  }

  // Status 관련 메서드
  get status(): DepositDetailStatus {
    return this._status;
  }

  isPending(): boolean {
    return this._status === DepositDetailStatus.PENDING;
  }

  isConfirming(): boolean {
    return this._status === DepositDetailStatus.CONFIRMING;
  }

  isCompleted(): boolean {
    return this._status === DepositDetailStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === DepositDetailStatus.FAILED;
  }

  isCancelled(): boolean {
    return this._status === DepositDetailStatus.CANCELLED;
  }

  isExpired(): boolean {
    return this._status === DepositDetailStatus.EXPIRED;
  }

  isRejected(): boolean {
    return this._status === DepositDetailStatus.REJECTED;
  }

  /**
   * 입금이 처리 가능한 상태인지 확인 (PENDING 또는 CONFIRMING)
   */
  canBeProcessed(): boolean {
    return (
      this._status === DepositDetailStatus.PENDING ||
      this._status === DepositDetailStatus.CONFIRMING
    );
  }

  /**
   * 입금이 완료된 상태인지 확인
   */
  isProcessed(): boolean {
    return (
      this._status === DepositDetailStatus.COMPLETED ||
      this._status === DepositDetailStatus.FAILED ||
      this._status === DepositDetailStatus.CANCELLED ||
      this._status === DepositDetailStatus.REJECTED
    );
  }

  // Method 관련 메서드
  getMethod(): DepositMethod {
    return this.method;
  }

  // Amount 관련 메서드
  getAmount(): DepositAmount {
    return this.amount;
  }

  // Crypto Wallet 관련 메서드
  /**
   * 지갑 주소가 있는지 확인
   */
  hasWalletAddress(): boolean {
    return this.walletAddress !== null && this.walletAddress.length > 0;
  }

  /**
   * 추가 ID가 필요한지 확인 (태그, 메모 등)
   */
  requiresExtraId(): boolean {
    return (
      this.walletAddressExtraId !== null &&
      this.walletAddressExtraId.length > 0
    );
  }

  /**
   * 관리자가 처리했는지 확인
   */
  isProcessedByAdmin(): boolean {
    return this.processedBy !== null;
  }

  /**
   * 실패 사유가 있는지 확인
   */
  hasFailureReason(): boolean {
    return this.failureReason !== null && this.failureReason.length > 0;
  }
}
