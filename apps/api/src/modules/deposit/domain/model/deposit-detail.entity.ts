// src/modules/deposit/domain/model/deposit-detail.entity.ts
import { Prisma } from '@repo/database';
import {
  DepositDetailStatus,
  ExchangeCurrencyCode,
  FeePaidByType,
} from '@repo/database';
import { DepositMethod } from './value-objects/deposit-method.vo';
import { DepositAmount } from './value-objects/deposit-amount.vo';
import { DepositAlreadyProcessedException, DepositException } from '../deposit.exception';

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
    public readonly id: bigint | null,
    public readonly uid: string,
    public readonly userId: bigint,
    private _transactionId: bigint | null,
    private _status: DepositDetailStatus,
    private method: DepositMethod,
    private amount: DepositAmount,
    public readonly depositCurrency: ExchangeCurrencyCode,
    public readonly walletAddress: string | null,
    public readonly walletAddressExtraId: string | null,
    public readonly depositNetwork: string | null,
    public readonly depositorName: string | null,
    public readonly providerPaymentId: string | null,
    private _transactionHash: string | null,
    public readonly bankConfigId: bigint | null,
    public readonly cryptoConfigId: bigint | null,
    private _processedBy: bigint | null,
    private _adminNote: string | null,
    public readonly ipAddress: string | null,
    public readonly deviceFingerprint: string | null,
    private _failureReason: string | null,
    public readonly providerMetadata: Record<string, any> | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _confirmedAt: Date | null,
    private _failedAt: Date | null,
  ) { }

  /**
   * 새로운 입금 요청 엔티티 생성
   */
  static create(params: {
    uid: string;
    userId: bigint;
    depositCurrency: ExchangeCurrencyCode;
    method: DepositMethod;
    amount: DepositAmount;
    bankConfigId?: bigint | null;
    cryptoConfigId?: bigint | null;
    walletAddress?: string | null;
    walletAddressExtraId?: string | null;
    depositNetwork?: string | null;
    depositorName?: string | null;
    providerPaymentId?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    providerMetadata?: Record<string, any> | null;
  }): DepositDetail {
    return new DepositDetail(
      null,
      params.uid,
      params.userId,
      null,
      DepositDetailStatus.PENDING,
      params.method,
      params.amount,
      params.depositCurrency,
      params.walletAddress ?? null,
      params.walletAddressExtraId ?? null,
      params.depositNetwork ?? null,
      params.depositorName ?? null,
      params.providerPaymentId ?? null,
      null,
      params.bankConfigId ?? null,
      params.cryptoConfigId ?? null,
      null,
      null,
      params.ipAddress ?? null,
      params.deviceFingerprint ?? null,
      null,
      params.providerMetadata ?? null,
      new Date(),
      new Date(),
      null,
      null,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    userId: bigint;
    transactionId: bigint | null;
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
      data.userId,
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
    id: bigint | null;
    uid: string;
    userId: bigint;
    transactionId: bigint | null;
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
      userId: this.userId,
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
      transactionHash: this._transactionHash,
      bankConfigId: this.bankConfigId,
      cryptoConfigId: this.cryptoConfigId,
      processedBy: this._processedBy,
      adminNote: this._adminNote,
      ipAddress: this.ipAddress,
      deviceFingerprint: this.deviceFingerprint,
      failureReason: this._failureReason,
      providerMetadata: this.providerMetadata,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      confirmedAt: this._confirmedAt,
      failedAt: this._failedAt,
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
    return this._failureReason !== null && this._failureReason.length > 0;
  }

  // Getters for mutable fields
  get transactionHash(): string | null {
    return this._transactionHash;
  }

  get transactionId(): bigint | null {
    return this._transactionId;
  }

  get processedBy(): bigint | null {
    return this._processedBy;
  }

  get adminNote(): string | null {
    return this._adminNote;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get confirmedAt(): Date | null {
    return this._confirmedAt;
  }

  get failedAt(): Date | null {
    return this._failedAt;
  }

  /**
   * 입금 승인 처리
   * @param actuallyPaid - 실제 입금 금액
   * @param adminId - 처리한 관리자 ID
   * @param transactionHash - 트랜잭션 해시 (선택적)
   * @param adminNote - 관리자 메모 (선택적)
   * @throws {DepositAlreadyProcessedException} 이미 처리된 입금인 경우
   */
  approve(
    actuallyPaid: Prisma.Decimal,
    adminId: bigint,
    transactionHash?: string | null,
    adminNote?: string | null,
    transactionId?: bigint | null,
  ): void {
    if (!this.id) throw new DepositException('Entity must be persisted before approval');
    if (!this.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(this.id, this._status);
    }

    if (transactionId) {
      this._transactionId = transactionId;
    }

    // 실제 입금 금액 설정
    this.amount = this.amount.withActuallyPaid(actuallyPaid);

    // 상태 변경
    this._status = DepositDetailStatus.COMPLETED;

    // 메타데이터 업데이트
    if (transactionHash !== undefined && transactionHash !== null) {
      this._transactionHash = transactionHash;
    }
    if (adminNote !== undefined && adminNote !== null) {
      this._adminNote = adminNote;
    }
    this._processedBy = adminId;
    this._confirmedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 입금 거부 처리
   * @param failureReason - 거부 사유
   * @param adminId - 처리한 관리자 ID
   * @throws {DepositAlreadyProcessedException} 이미 처리된 입금인 경우
   */
  reject(failureReason: string, adminId: bigint): void {
    if (!this.id) throw new DepositException('Entity must be persisted before rejection');
    if (!this.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(this.id, this._status);
    }

    // 상태 변경
    this._status = DepositDetailStatus.REJECTED;

    // 메타데이터 업데이트
    this._failureReason = failureReason;
    this._processedBy = adminId;
    this._failedAt = new Date();
    this._updatedAt = new Date();
  }
}
