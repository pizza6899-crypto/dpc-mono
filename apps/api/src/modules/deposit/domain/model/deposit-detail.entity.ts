import {
  Prisma,
  DepositDetailStatus,
  DepositMethodType,
  QuestType,
  ResetCycle,
  ExchangeCurrencyCode,
  PaymentProvider,
  FeePaidByType,
} from '@prisma/client';
import { QuestMasterSnapshot } from 'src/modules/quest/core/domain/models/quest.interface';
import { DepositMethod } from './value-objects/deposit-method.vo';
import { DepositAmount } from './value-objects/deposit-amount.vo';
import {
  DepositAlreadyProcessedException,
  DepositNotPersistedException,
  DepositFiatNotInProcessingException,
} from '../deposit.exception';

/**
 * 입금 프로바이더별 추가 메타데이터
 */
export interface DepositProviderMetadata {
  [key: string]: any;      // 기타 확장성 확보 (PG사 응답 데이터 등)
}

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
    private _processedBy: bigint | null,
    public readonly depositorBank: string | null,
    public readonly depositorAccount: string | null,
    public readonly ipAddress: string | null,
    public readonly deviceFingerprint: string | null,
    public readonly appliedQuestId: bigint | null,
    public readonly promotionSnapshot: QuestMasterSnapshot | null,
    public readonly providerMetadata: DepositProviderMetadata | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _confirmedAt: Date | null,
    private _failedAt: Date | null,
  ) { }

  /**
   * 새로운 입금 요청 엔티티 생성
   */
  static create(params: {
    userId: bigint;
    depositCurrency: ExchangeCurrencyCode;
    method: DepositMethod;
    amount: DepositAmount;
    walletAddress?: string | null;
    walletAddressExtraId?: string | null;
    depositNetwork?: string | null;
    depositorName?: string | null;
    depositorBank?: string | null;
    depositorAccount?: string | null;
    providerPaymentId?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    appliedQuestId?: bigint | null;
    promotionSnapshot?: QuestMasterSnapshot | null;
    providerMetadata?: DepositProviderMetadata | null;
  }): DepositDetail {
    return new DepositDetail(
      0n,
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
      null,
      params.depositorBank ?? null,
      params.depositorAccount ?? null,
      params.ipAddress ?? null,
      params.deviceFingerprint ?? null,
      params.appliedQuestId ?? null,
      params.promotionSnapshot ?? null,
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
    userId: bigint;
    transactionId: bigint | null;
    status: DepositDetailStatus;
    methodType: DepositMethodType;
    provider: PaymentProvider;
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
    appliedQuestId: bigint | null;
    promotionSnapshot: any | null;
    providerMetadata: DepositProviderMetadata | null;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    failedAt: Date | null;
  }): DepositDetail {
    return new DepositDetail(
      data.id,
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
      data.processedBy,
      data.depositorBank,
      data.depositorAccount,
      data.ipAddress,
      data.deviceFingerprint,
      data.appliedQuestId,
      data.promotionSnapshot,
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
    userId: bigint;
    transactionId: bigint | null;
    status: DepositDetailStatus;
    methodType: DepositMethodType;
    provider: PaymentProvider;
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
    appliedQuestId: bigint | null;
    promotionSnapshot: any | null;
    providerMetadata: DepositProviderMetadata | null;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    failedAt: Date | null;
  } {
    const methodData = this.method.toPersistence();
    const amountData = this.amount.toPersistence();

    return {
      id: this.id,
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
      depositorBank: this.depositorBank,
      depositorAccount: this.depositorAccount,
      providerPaymentId: this.providerPaymentId,
      transactionHash: this._transactionHash,
      processedBy: this._processedBy,
      ipAddress: this.ipAddress,
      deviceFingerprint: this.deviceFingerprint,
      appliedQuestId: this.appliedQuestId,
      promotionSnapshot: this.promotionSnapshot,
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

  isProcessing(): boolean {
    return this._status === DepositDetailStatus.PROCESSING;
  }

  isCanceled(): boolean {
    return this._status === DepositDetailStatus.CANCELED;
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
      this._status === DepositDetailStatus.PROCESSING ||
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
      this._status === DepositDetailStatus.CANCELED ||
      this._status === DepositDetailStatus.REJECTED ||
      this._status === DepositDetailStatus.EXPIRED
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
      this.walletAddressExtraId !== null && this.walletAddressExtraId.length > 0
    );
  }

  /**
   * 관리자가 처리했는지 확인
   */
  isProcessedByAdmin(): boolean {
    return this.processedBy !== null;
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
   * @param transactionId - 외부 트랜잭션 ID (선택적)
   * @throws {DepositAlreadyProcessedException} 이미 처리된 입금인 경우
   */
  approve(
    actuallyPaid: Prisma.Decimal,
    adminId: bigint,
    transactionHash?: string | null,
    transactionId?: bigint | null,
  ): void {
    if (this.id === 0n)
      throw new DepositNotPersistedException('approve');
    if (!this.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(this._status);
    }

    // 피아트 입금 단방향 제어: 반드시 PROCESSING 상태를 거쳐야 함
    if (this.method.methodType === DepositMethodType.BANK_TRANSFER && this._status !== DepositDetailStatus.PROCESSING) {
      throw new DepositFiatNotInProcessingException();
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
    if (this.id === 0n)
      throw new DepositNotPersistedException('reject');
    if (!this.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(this._status);
    }

    // 피아트 입금 단방향 제어: 반드시 PROCESSING 상태를 거쳐야 함
    if (this.method.methodType === DepositMethodType.BANK_TRANSFER && this._status !== DepositDetailStatus.PROCESSING) {
      throw new DepositFiatNotInProcessingException();
    }

    // 상태 변경
    this._status = DepositDetailStatus.REJECTED;

    // 메타데이터 업데이트
    this._processedBy = adminId;
    this._failedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 관리자 확인 시작 (상태 선점)
   * @param adminId - 처리 대기 중인 관리자 ID
   */
  startProcessing(adminId: bigint): void {
    if (this.id === 0n)
      throw new DepositNotPersistedException('startProcessing');
    if (this._status !== DepositDetailStatus.PENDING) {
      throw new DepositAlreadyProcessedException(this._status);
    }

    this._status = DepositDetailStatus.PROCESSING;
    this._processedBy = adminId;
    this._updatedAt = new Date();
  }

  /**
   * 입금 취소 처리 (사용자 직접 취소)
   * @throws {DepositAlreadyProcessedException} 이미 처리된 입금인 경우
   */
  cancel(): void {
    if (this.id === 0n)
      throw new DepositNotPersistedException('cancel');
    // 충돌 방지: PENDING 상태에서만 취소 가능 (관리자가 처리 중이거나 자동 확인 중이면 불가)
    if (this._status !== DepositDetailStatus.PENDING) {
      throw new DepositAlreadyProcessedException(this._status);
    }

    // 상태 변경
    this._status = DepositDetailStatus.CANCELED;

    // 메타데이터 업데이트
    this._updatedAt = new Date();
  }
}
