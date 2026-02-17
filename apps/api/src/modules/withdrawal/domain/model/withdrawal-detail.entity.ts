import type {
  Prisma,
  ExchangeCurrencyCode,
  FeePaidByType,
} from '@prisma/client';
import {
  PaymentProvider,
  WithdrawalMethodType,
  WithdrawalStatus,
  WithdrawalProcessingMode,
} from '@prisma/client';
import {
  InvalidWithdrawalStatusException,
  WithdrawalCannotBeCancelledException,
} from '../withdrawal.exception';

export interface WithdrawalDetailProps {
  userId: bigint;
  methodType: WithdrawalMethodType;
  status: WithdrawalStatus;
  processingMode: WithdrawalProcessingMode;
  currency: ExchangeCurrencyCode;
  requestedAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal | null;
  feeAmount: Prisma.Decimal | null;
  feeCurrency: string | null;
  feePaidBy: FeePaidByType | null;
  network: string | null;
  walletAddress: string | null;
  walletAddressExtraId: string | null;
  transactionHash: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  provider: PaymentProvider;
  providerWithdrawalId: string | null;
  providerMetadata: Record<string, unknown>;
  processedBy: bigint | null;
  adminNotes: string[];
  failureReason: string | null;
  ipAddress: string | null;
  deviceFingerprint: string | null;
  appliedConfig: Record<string, unknown>;
  transactionId: bigint | null;
  cryptoWithdrawConfigId: bigint | null;
  bankWithdrawConfigId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
}

export class WithdrawalDetail {
  private constructor(
    public readonly id: bigint,
    public readonly props: WithdrawalDetailProps,
  ) { }

  // ===== 팩토리 메서드 =====

  /**
   * 암호화폐 출금 생성
   */
  static createCrypto(params: {
    id: bigint;
    timestamp: Date;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    requestedAmount: Prisma.Decimal;
    network: string;
    walletAddress: string;
    walletAddressExtraId?: string | null;
    processingMode: WithdrawalProcessingMode;
    appliedConfig: Record<string, unknown>;
    cryptoWithdrawConfigId: bigint;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    feeAmount?: Prisma.Decimal | null;
    netAmount?: Prisma.Decimal | null;
  }): WithdrawalDetail {
    return new WithdrawalDetail(params.id, {
      userId: params.userId,
      methodType: WithdrawalMethodType.CRYPTO_WALLET,
      status: WithdrawalStatus.PENDING,
      processingMode: params.processingMode,
      currency: params.currency,
      requestedAmount: params.requestedAmount,
      netAmount: params.netAmount ?? params.requestedAmount,
      feeAmount: params.feeAmount ?? null,
      feeCurrency: null,
      feePaidBy: null,
      network: params.network,
      walletAddress: params.walletAddress,
      walletAddressExtraId: params.walletAddressExtraId ?? null,
      transactionHash: null,
      bankName: null,
      accountNumber: null,
      accountHolder: null,
      provider: PaymentProvider.NOWPAYMENT,
      providerWithdrawalId: null,
      providerMetadata: {},
      processedBy: null,
      adminNotes: [],
      failureReason: null,
      ipAddress: params.ipAddress ?? null,
      deviceFingerprint: params.deviceFingerprint ?? null,
      appliedConfig: params.appliedConfig,
      transactionId: null,
      cryptoWithdrawConfigId: params.cryptoWithdrawConfigId,
      bankWithdrawConfigId: null,
      createdAt: params.timestamp,
      updatedAt: params.timestamp,
      confirmedAt: null,
      failedAt: null,
      cancelledAt: null,
    });
  }

  /**
   * 은행 출금 생성
   */
  static createBank(params: {
    id: bigint;
    timestamp: Date;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    requestedAmount: Prisma.Decimal;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    appliedConfig: Record<string, unknown>;
    bankWithdrawConfigId: bigint;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    feeAmount?: Prisma.Decimal | null;
    netAmount?: Prisma.Decimal | null;
  }): WithdrawalDetail {
    return new WithdrawalDetail(params.id, {
      userId: params.userId,
      methodType: WithdrawalMethodType.BANK_TRANSFER,
      status: WithdrawalStatus.PENDING,
      processingMode: WithdrawalProcessingMode.MANUAL, // 피아트는 항상 수동
      currency: params.currency,
      requestedAmount: params.requestedAmount,
      netAmount: params.netAmount ?? params.requestedAmount,
      feeAmount: params.feeAmount ?? null,
      feeCurrency: null,
      feePaidBy: null,
      network: null,
      walletAddress: null,
      walletAddressExtraId: null,
      transactionHash: null,
      bankName: params.bankName,
      accountNumber: params.accountNumber,
      accountHolder: params.accountHolder,
      provider: PaymentProvider.MANUAL,
      providerWithdrawalId: null,
      providerMetadata: {},
      processedBy: null,
      adminNotes: [],
      failureReason: null,
      ipAddress: params.ipAddress ?? null,
      deviceFingerprint: params.deviceFingerprint ?? null,
      appliedConfig: params.appliedConfig,
      transactionId: null,
      cryptoWithdrawConfigId: null,
      bankWithdrawConfigId: params.bankWithdrawConfigId,
      createdAt: params.timestamp,
      updatedAt: params.timestamp,
      confirmedAt: null,
      failedAt: null,
      cancelledAt: null,
    });
  }

  /**
   * DB에서 복원
   */
  static rehydrate(id: bigint, props: WithdrawalDetailProps): WithdrawalDetail {
    return new WithdrawalDetail(id, props);
  }

  // ===== Getters =====

  get status(): WithdrawalStatus {
    return this.props.status;
  }

  get userId(): bigint {
    return this.props.userId;
  }

  get currency(): ExchangeCurrencyCode {
    return this.props.currency;
  }

  get requestedAmount(): Prisma.Decimal {
    return this.props.requestedAmount;
  }

  get methodType(): WithdrawalMethodType {
    return this.props.methodType;
  }

  get processingMode(): WithdrawalProcessingMode {
    return this.props.processingMode;
  }

  // ===== 상태 확인 메서드 =====

  get isPending(): boolean {
    return this.props.status === WithdrawalStatus.PENDING;
  }

  get isPendingReview(): boolean {
    return this.props.status === WithdrawalStatus.PENDING_REVIEW;
  }

  get isProcessing(): boolean {
    return this.props.status === WithdrawalStatus.PROCESSING;
  }

  get isSending(): boolean {
    return this.props.status === WithdrawalStatus.SENDING;
  }

  get isCompleted(): boolean {
    return this.props.status === WithdrawalStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.props.status === WithdrawalStatus.FAILED;
  }

  get isCancelled(): boolean {
    return this.props.status === WithdrawalStatus.CANCELLED;
  }

  get isRejected(): boolean {
    return this.props.status === WithdrawalStatus.REJECTED;
  }

  get isTerminal(): boolean {
    return (
      this.isCompleted || this.isFailed || this.isCancelled || this.isRejected
    );
  }

  // ===== 상태 전이 메서드 =====

  /**
   * 수동 검토 대기로 전환 (자동 처리 한도 초과 등)
   */
  markPendingReview(): void {
    if (this.props.status !== WithdrawalStatus.PENDING) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PENDING,
      ]);
    }
    this.props.status = WithdrawalStatus.PENDING_REVIEW;
    this.props.updatedAt = new Date();
  }

  /**
   * 관리자 승인 → 처리 중으로 전환
   */
  approve(adminId: bigint, note?: string): void {
    if (this.props.status !== WithdrawalStatus.PENDING_REVIEW) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PENDING_REVIEW,
      ]);
    }
    this.props.status = WithdrawalStatus.PROCESSING;
    this.props.processedBy = adminId;
    if (note) {
      this.props.adminNotes.push(`[APPROVED] ${note}`);
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 관리자 거부 → 잔액 복원 필요
   */
  reject(adminId: bigint, reason: string): void {
    if (this.props.status !== WithdrawalStatus.PENDING_REVIEW) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PENDING_REVIEW,
      ]);
    }
    this.props.status = WithdrawalStatus.REJECTED;
    this.props.processedBy = adminId;
    this.props.failureReason = reason;
    this.props.adminNotes.push(`[REJECTED] ${reason}`);
    this.props.updatedAt = new Date();
  }

  /**
   * 유저 취소 → 잔액 복원 필요
   */
  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new WithdrawalCannotBeCancelledException(
        this.props.status,
      );
    }
    this.props.status = WithdrawalStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * 처리 중으로 전환 (자동 처리 시작)
   */
  markProcessing(): void {
    const isAllowed =
      this.props.status === WithdrawalStatus.PENDING ||
      this.props.status === WithdrawalStatus.PENDING_REVIEW;
    if (!isAllowed) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PENDING,
        WithdrawalStatus.PENDING_REVIEW,
      ]);
    }
    this.props.status = WithdrawalStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  /**
   * 전송 중으로 전환 (프로바이더에 요청됨)
   */
  markSending(providerWithdrawalId: string): void {
    if (this.props.status !== WithdrawalStatus.PROCESSING) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PROCESSING,
      ]);
    }
    this.props.status = WithdrawalStatus.SENDING;
    this.props.providerWithdrawalId = providerWithdrawalId;
    this.props.updatedAt = new Date();
  }

  /**
   * 완료 처리
   */
  complete(transactionHash?: string): void {
    const isAllowed =
      this.props.status === WithdrawalStatus.PROCESSING ||
      this.props.status === WithdrawalStatus.SENDING;
    if (!isAllowed) {
      throw new InvalidWithdrawalStatusException(this.props.status, [
        WithdrawalStatus.PROCESSING,
        WithdrawalStatus.SENDING,
      ]);
    }
    this.props.status = WithdrawalStatus.COMPLETED;
    this.props.confirmedAt = new Date();
    if (transactionHash) {
      this.props.transactionHash = transactionHash;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 실패 처리 → 잔액 복원 필요
   */
  fail(reason: string): void {
    this.props.status = WithdrawalStatus.FAILED;
    this.props.failureReason = reason;
    this.props.failedAt = new Date();
    this.props.updatedAt = new Date();
  }

  // ===== 비즈니스 로직 =====

  /**
   * 유저 취소 가능 여부
   */
  canBeCancelled(): boolean {
    return (
      this.props.status === WithdrawalStatus.PENDING ||
      this.props.status === WithdrawalStatus.PENDING_REVIEW
    );
  }

  /**
   * 관리자 승인 가능 여부
   */
  canBeApproved(): boolean {
    return this.props.status === WithdrawalStatus.PENDING_REVIEW;
  }

  /**
   * Transaction ID 설정
   */
  setTransactionId(transactionId: bigint): void {
    this.props.transactionId = transactionId;
    this.props.updatedAt = new Date();
  }

  /**
   * 관리자 노트 추가
   */
  addAdminNote(note: string): void {
    this.props.adminNotes.push(note);
    this.props.updatedAt = new Date();
  }

  /**
   * 프로바이더 메타데이터 업데이트
   */
  updateProviderMetadata(metadata: Record<string, unknown>): void {
    this.props.providerMetadata = {
      ...this.props.providerMetadata,
      ...metadata,
    };
    this.props.updatedAt = new Date();
  }
}
