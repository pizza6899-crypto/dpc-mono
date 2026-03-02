// src/modules/reward/domain/reward.entity.ts
import type {
  ExchangeCurrencyCode,
  RewardItemType,
  RewardSourceType,
} from '@prisma/client';
import { RewardStatus, WageringTargetType } from '@prisma/client';
import type Decimal from 'decimal.js';
import type { RewardMetadata } from './reward.types';
import {
  RewardCannotBeClaimedException,
  RewardOnlyPendingCanExpireException,
  RewardOnlyPendingCanVoidException,
} from './reward.exception';

export interface UserRewardProps {
  id: bigint;
  userId: bigint;
  sourceType: RewardSourceType;
  sourceId: bigint | null;

  rewardType: RewardItemType;
  currency: ExchangeCurrencyCode;
  amount: Decimal;

  wageringTargetType: WageringTargetType;
  wageringMultiplier: Decimal | null;
  wageringExpiryDays: number | null;
  maxCashConversion: Decimal | null;
  isForfeitable: boolean;

  status: RewardStatus;
  expiresAt: Date | null;
  claimedAt: Date | null;

  reason: string | null;
  metadata: RewardMetadata | null;

  createdAt: Date;
  updatedAt: Date;
}

export class UserReward {
  constructor(private readonly props: UserRewardProps) {}

  /**
   * 비즈니스 로직: 신규 보상(쿠폰) 발행 팩토리 메서드
   * - 발급 시나리오(Grant)에서 복잡한 Props 조립과 초기 상태(PENDING)를 캡슐화합니다.
   */
  public static create(params: {
    id: bigint;
    userId: bigint;
    sourceType: RewardSourceType;
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: Decimal;
    sourceId?: bigint;
    wageringTargetType?: WageringTargetType;
    wageringMultiplier?: Decimal;
    wageringExpiryDays?: number;
    maxCashConversion?: Decimal;
    isForfeitable?: boolean;
    expiresAt?: Date;
    metadata?: RewardMetadata;
    reason?: string;
    createdAt?: Date;
  }): UserReward {
    const now = params.createdAt ?? new Date();
    return new UserReward({
      id: params.id,
      userId: params.userId,
      sourceType: params.sourceType,
      sourceId: params.sourceId ?? null,
      rewardType: params.rewardType,
      currency: params.currency,
      amount: params.amount,
      wageringTargetType:
        params.wageringTargetType ?? WageringTargetType.AMOUNT,
      wageringMultiplier: params.wageringMultiplier ?? null,
      wageringExpiryDays: params.wageringExpiryDays ?? null,
      maxCashConversion: params.maxCashConversion ?? null,
      isForfeitable: params.isForfeitable ?? true,
      status: RewardStatus.PENDING, // 발급 시 무조건 PENDING
      expiresAt: params.expiresAt ?? null,
      claimedAt: null,
      reason: params.reason ?? null,
      metadata: params.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Getters
  get id(): bigint {
    return this.props.id;
  }
  get userId(): bigint {
    return this.props.userId;
  }
  get sourceType(): RewardSourceType {
    return this.props.sourceType;
  }
  get sourceId(): bigint | null {
    return this.props.sourceId;
  }

  get rewardType(): RewardItemType {
    return this.props.rewardType;
  }
  get currency(): ExchangeCurrencyCode {
    return this.props.currency;
  }
  get amount(): Decimal {
    return this.props.amount;
  }

  get wageringTargetType(): WageringTargetType {
    return this.props.wageringTargetType;
  }
  get wageringMultiplier(): Decimal | null {
    return this.props.wageringMultiplier;
  }
  get wageringExpiryDays(): number | null {
    return this.props.wageringExpiryDays;
  }
  get maxCashConversion(): Decimal | null {
    return this.props.maxCashConversion;
  }
  get isForfeitable(): boolean {
    return this.props.isForfeitable;
  }

  get status(): RewardStatus {
    return this.props.status;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }
  get claimedAt(): Date | null {
    return this.props.claimedAt;
  }

  get reason(): string | null {
    return this.props.reason;
  }
  get metadata(): RewardMetadata | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // 비즈니스 로직: 유저가 수령(Claim) 가능한 상태인지 검증 (Testability를 위해 now 주입 가능)
  public canClaim(now: Date = new Date()): boolean {
    if (this.props.status !== RewardStatus.PENDING) return false;
    if (this.props.expiresAt && now > this.props.expiresAt) return false;
    return true;
  }

  // 상태 전이 메커니즘
  public markAsClaimed(claimedAt: Date = new Date()): void {
    if (!this.canClaim(claimedAt)) {
      throw new RewardCannotBeClaimedException();
    }
    this.props.status = RewardStatus.CLAIMED;
    this.props.claimedAt = claimedAt;
  }

  public markAsExpired(): void {
    if (this.props.status !== RewardStatus.PENDING) {
      throw new RewardOnlyPendingCanExpireException();
    }
    this.props.status = RewardStatus.EXPIRED;
  }

  public markAsVoided(reason?: string): void {
    // PENDING 상태의 보상만 취소 가능 (EXPIRED, CLAIMED는 불가)
    if (this.props.status !== RewardStatus.PENDING) {
      throw new RewardOnlyPendingCanVoidException();
    }
    this.props.status = RewardStatus.VOIDED;
    if (reason) {
      this.props.reason = reason;
    }
  }

  // Prisma나 Mapper가 필요로 할 때 프로퍼티 추출
  public toSnapshot(): UserRewardProps {
    return { ...this.props };
  }
}
