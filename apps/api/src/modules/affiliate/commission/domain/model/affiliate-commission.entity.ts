// src/modules/affiliate/commission/domain/model/affiliate-commission.entity.ts
import type {
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@prisma/client';
import { CommissionStatus } from '@prisma/client';
import {
  CommissionNotAvailableException,
  InvalidCommissionCalculationException,
  InvalidSettlementDateException,
} from '../commission.exception';

/**
 * 어필리에이트 커미션 엔티티
 * Bet Share 모델: 베팅 금액의 일정 비율
 */
export class AffiliateCommission {
  private constructor(
    public readonly id: bigint | null, // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly uid: string, // 비즈니스용 (CUID, 애플리케이션에서 생성 필수)
    public readonly affiliateId: string,
    public readonly subUserId: string,
    public readonly gameRoundId: bigint | null, // Prisma BigInt 타입
    private _wagerAmount: Prisma.Decimal, // 베팅 금액
    private _winAmount: Prisma.Decimal | null, // 당첨 금액 (참고용)
    private _commission: Prisma.Decimal, // 커미션 금액 = wagerAmount * rateApplied
    private _rateApplied: Prisma.Decimal, // 적용된 요율 (예: 0.01 = 1%)
    public readonly currency: ExchangeCurrencyCode,
    private _status: CommissionStatus,
    public readonly gameCategory: GameCategory | null,
    private _settlementDate: Date | null,
    private _claimedAt: Date | null,
    private _withdrawnAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * 새로운 커미션 생성
   * @param params - 커미션 생성 파라미터
   * @returns 생성된 커미션 엔티티
   * @description 새 엔티티 생성 시 id=null, uid는 애플리케이션에서 CUID 생성하여 전달 필수
   * @description Application 레이어에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static create(params: {
    id?: bigint; // 선택적: 영속화된 엔티티 재생성 시에만 사용
    uid: string; // 필수: 애플리케이션에서 CUID 생성하여 전달 (IdUtil.generateCuid() 사용)
    affiliateId: string;
    subUserId: string;
    gameRoundId: bigint | null;
    wagerAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal | null;
    commission: Prisma.Decimal;
    rateApplied: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    gameCategory: GameCategory | null;
  }): AffiliateCommission {
    // 커미션 계산 검증: wagerAmount * rateApplied === commission
    const expectedCommission = params.wagerAmount.mul(params.rateApplied);
    if (!expectedCommission.equals(params.commission)) {
      throw new InvalidCommissionCalculationException(
        params.wagerAmount.toString(),
        params.rateApplied.toString(),
        expectedCommission.toString(),
        params.commission.toString(),
      );
    }

    const now = new Date();
    return new AffiliateCommission(
      params.id ?? null, // 새 엔티티는 null, DB 저장 시 자동 생성
      params.uid, // 애플리케이션에서 생성한 CUID
      params.affiliateId,
      params.subUserId,
      params.gameRoundId,
      params.wagerAmount,
      params.winAmount,
      params.commission,
      params.rateApplied,
      params.currency,
      CommissionStatus.PENDING,
      params.gameCategory,
      null, // settlementDate
      null, // claimedAt
      null, // withdrawnAt
      now, // createdAt
      now, // updatedAt
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @description 영속화된 엔티티는 id와 uid 모두 보유
   * @description Mapper에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static fromPersistence(data: {
    id: bigint | null;
    uid: string;
    affiliateId: string;
    subUserId: string;
    gameRoundId: bigint | null;
    wagerAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal | null;
    commission: Prisma.Decimal;
    rateApplied: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    status: CommissionStatus;
    gameCategory: GameCategory | null;
    settlementDate: Date | null;
    claimedAt: Date | null;
    withdrawnAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AffiliateCommission {
    return new AffiliateCommission(
      data.id,
      data.uid,
      data.affiliateId,
      data.subUserId,
      data.gameRoundId,
      data.wagerAmount,
      data.winAmount,
      data.commission,
      data.rateApplied,
      data.currency,
      data.status,
      data.gameCategory,
      data.settlementDate,
      data.claimedAt,
      data.withdrawnAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get wagerAmount(): Prisma.Decimal {
    return this._wagerAmount;
  }

  get winAmount(): Prisma.Decimal | null {
    return this._winAmount;
  }

  get commission(): Prisma.Decimal {
    return this._commission;
  }

  get rateApplied(): Prisma.Decimal {
    return this._rateApplied;
  }

  get status(): CommissionStatus {
    return this._status;
  }

  get settlementDate(): Date | null {
    return this._settlementDate;
  }

  get claimedAt(): Date | null {
    return this._claimedAt;
  }

  get withdrawnAt(): Date | null {
    return this._withdrawnAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Logic Methods

  /**
   * 정산 가능 여부 확인
   * @returns 정산 가능 여부
   */
  canSettle(): boolean {
    return this._status === CommissionStatus.PENDING;
  }

  /**
   * 출금 가능 여부 확인
   * @returns 출금 가능 여부
   */
  canClaim(): boolean {
    return this._status === CommissionStatus.AVAILABLE;
  }

  /**
   * 취소 가능 여부 확인
   * @returns 취소 가능 여부
   */
  canCancel(): boolean {
    return (
      this._status === CommissionStatus.PENDING ||
      this._status === CommissionStatus.AVAILABLE
    );
  }

  /**
   * 커미션 정산 처리 (PENDING → AVAILABLE)
   * @param settlementDate - 정산일
   * @throws {CommissionNotAvailableException} 정산 불가능한 상태인 경우
   * @throws {InvalidSettlementDateException} 정산일이 생성일보다 이전인 경우
   */
  settle(settlementDate: Date): void {
    if (!this.canSettle()) {
      throw new CommissionNotAvailableException(
        `커미션을 정산할 수 없습니다. 현재 상태: ${this._status}`,
      );
    }

    // 정산일 검증: settlementDate는 createdAt보다 이전일 수 없음
    if (settlementDate < this.createdAt) {
      throw new InvalidSettlementDateException(settlementDate, this.createdAt);
    }

    this._status = CommissionStatus.AVAILABLE;
    this._settlementDate = settlementDate;
    this._updatedAt = new Date();
  }

  /**
   * 출금 요청 처리 (AVAILABLE → CLAIMED)
   * @throws {CommissionNotAvailableException} 출금 불가능한 상태인 경우
   */
  claim(): void {
    if (!this.canClaim()) {
      throw new CommissionNotAvailableException(
        `커미션을 출금할 수 없습니다. 현재 상태: ${this._status}`,
      );
    }
    this._status = CommissionStatus.CLAIMED;
    this._claimedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 출금 완료 처리 (CLAIMED → WITHDRAWN)
   * @throws {CommissionNotAvailableException} 출금 완료 처리 불가능한 상태인 경우
   */
  withdraw(): void {
    if (this._status !== CommissionStatus.CLAIMED) {
      throw new CommissionNotAvailableException(
        `출금 완료 처리할 수 없습니다. 현재 상태: ${this._status}`,
      );
    }
    this._status = CommissionStatus.WITHDRAWN;
    this._withdrawnAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 커미션 취소 처리 (PENDING/AVAILABLE → CANCELLED)
   * @throws {CommissionNotAvailableException} 취소 불가능한 상태인 경우
   */
  cancel(): void {
    if (!this.canCancel()) {
      throw new CommissionNotAvailableException(
        `커미션을 취소할 수 없습니다. 현재 상태: ${this._status}`,
      );
    }
    this._status = CommissionStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  /**
   * DB 저장을 위한 데이터 변환
   */
  toPersistence() {
    return {
      id: this.id,
      uid: this.uid,
      affiliateId: this.affiliateId,
      subUserId: this.subUserId,
      gameRoundId: this.gameRoundId,
      wagerAmount: this._wagerAmount,
      winAmount: this._winAmount,
      commission: this._commission,
      rateApplied: this._rateApplied,
      currency: this.currency,
      status: this._status,
      gameCategory: this.gameCategory,
      settlementDate: this._settlementDate,
      claimedAt: this._claimedAt,
      withdrawnAt: this._withdrawnAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
