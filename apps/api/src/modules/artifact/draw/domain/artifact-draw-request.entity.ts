import {
  ArtifactDrawStatus,
  ArtifactDrawType,
  ArtifactDrawPaymentType,
  ArtifactGrade,
  ExchangeCurrencyCode,
} from '@prisma/client';

/**
 * [Artifact Draw] 최종 당첨 결과 (블록해시 및 개별 유물 목록 결합)
 */
export interface ArtifactDrawResult {
  blockhash: string;
  userArtifactId: bigint; // UserArtifact 고유 ID (PK)
  artifactCode: string;   // Artifact Catalog Code (Unique String)
  grade: ArtifactGrade;
  roll: number;           // 결과 산출에 사용된 0 ~ 1 사이의 (재계산된) 난수
  rawRoll: number;        // 원본 0 ~ 1 사이의 난수 (등급 결정용)
}

/**
 * [Artifact Draw] 유물 뽑기 요청(Commit-Reveal) 엔티티
 */
export class ArtifactDrawRequest {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _targetSlot: bigint,
    private readonly _drawType: ArtifactDrawType,
    private readonly _paymentType: ArtifactDrawPaymentType,
    private readonly _ticketType: string | null,
    private readonly _currencyCode: ExchangeCurrencyCode | null,
    private _status: ArtifactDrawStatus,
    private _result: ArtifactDrawResult[] | null,
    private _settledAt: Date | null,
    private _claimedAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원 (Persistence to Domain)
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    targetSlot: bigint;
    drawType: ArtifactDrawType;
    paymentType: ArtifactDrawPaymentType;
    ticketType: string | null;
    currencyCode: ExchangeCurrencyCode | null;
    status: ArtifactDrawStatus;
    result: ArtifactDrawResult[] | null;
    settledAt: Date | null;
    claimedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ArtifactDrawRequest {
    return new ArtifactDrawRequest(
      data.id,
      data.userId,
      data.targetSlot,
      data.drawType,
      data.paymentType,
      data.ticketType,
      data.currencyCode,
      data.status,
      data.result,
      data.settledAt,
      data.claimedAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 신규 뽑기 요청 생성 (Commit 단계)
   */
  static create(data: {
    userId: bigint;
    targetSlot: bigint;
    drawType: ArtifactDrawType;
    paymentType: ArtifactDrawPaymentType;
    ticketType?: string | null;
    currencyCode?: ExchangeCurrencyCode | null;
  }): ArtifactDrawRequest {
    const now = new Date();
    return new ArtifactDrawRequest(
      0n, // 신규 생성 시 ID는 DB에서 부여
      data.userId,
      data.targetSlot,
      data.drawType,
      data.paymentType,
      data.ticketType ?? null,
      data.currencyCode ?? null,
      ArtifactDrawStatus.PENDING,
      null,
      null,
      null,
      now,
      now,
    );
  }

  /**
   * 결과 산출 완료 처리 (Settle 단계)
   * - 블록 해시가 확인되어 서버에서 보상을 확정한 상태
   */
  settle(results: ArtifactDrawResult[]): void {
    if (this._status !== ArtifactDrawStatus.PENDING) {
      throw new Error(`Invalid status transition: current status is ${this._status}`);
    }
    this._result = results;
    this._status = ArtifactDrawStatus.SETTLED;
    this._settledAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 유저 결과 확인 완료 처리 (Claim 단계)
   * - 유저가 클라이언트 연출을 보고 최종 수령을 확정한 상태
   */
  claim(): void {
    if (this._status !== ArtifactDrawStatus.SETTLED) {
      throw new Error(`Invalid status transition: current status is ${this._status}`);
    }
    this._status = ArtifactDrawStatus.CLAIMED;
    this._claimedAt = new Date();
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get targetSlot(): bigint { return this._targetSlot; }
  get drawType(): ArtifactDrawType { return this._drawType; }
  get paymentType(): ArtifactDrawPaymentType { return this._paymentType; }
  get ticketType(): string | null { return this._ticketType; }
  get currencyCode(): ExchangeCurrencyCode | null { return this._currencyCode; }
  get blockhash(): string | null { return this._result && this._result.length > 0 ? this._result[0].blockhash : null; }
  get status(): ArtifactDrawStatus { return this._status; }
  get result(): ArtifactDrawResult[] | null { return this._result; }
  get settledAt(): Date | null { return this._settledAt; }
  get claimedAt(): Date | null { return this._claimedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
