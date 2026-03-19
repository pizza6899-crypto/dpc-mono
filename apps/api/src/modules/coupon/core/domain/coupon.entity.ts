import { CouponStatus, ExchangeCurrencyCode, RewardItemType } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  CouponAllowlistOnlyException,
  CouponExhaustedException,
  CouponExpiredException,
  CouponInactiveException,
  CouponNotStartedException,
  CouponUserUsageExceededException,
  CouponVoidedException,
} from './coupon.exception';
import { CouponMetadata } from './coupon.types';

export interface CouponRewardProps {
  rewardType: RewardItemType;
  currency: ExchangeCurrencyCode;
  amount: Decimal;
  wageringMultiplier: Decimal | null;
  maxCashConversion: Decimal | null;
}

export interface CouponProps {
  id: bigint;
  code: string;
  metadata: CouponMetadata | null;
  isAllowlistOnly: boolean;
  maxUsage: number;
  usageCount: number;
  maxUsagePerUser: number;
  status: CouponStatus;
  startsAt: Date | null;
  expiresAt: Date | null;
  rewards: CouponRewardProps[];
  createdBy: bigint | null;
  updatedBy: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Coupon {
  private constructor(private readonly props: CouponProps) {}

  static fromPersistence(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  static create(params: {
    code: string;
    metadata?: CouponMetadata;
    isAllowlistOnly?: boolean;
    maxUsage?: number;
    maxUsagePerUser?: number;
    startsAt?: Date;
    expiresAt?: Date;
    rewards: CouponRewardProps[];
    createdBy?: bigint;
  }): Coupon {
    const now = new Date();
    return new Coupon({
      id: 0n, // DB에서 할당됨
      code: params.code,
      metadata: params.metadata ?? null,
      isAllowlistOnly: params.isAllowlistOnly ?? false,
      maxUsage: params.maxUsage ?? 0,
      usageCount: 0,
      maxUsagePerUser: params.maxUsagePerUser ?? 1,
      status: CouponStatus.ACTIVE,
      startsAt: params.startsAt ?? null,
      expiresAt: params.expiresAt ?? null,
      rewards: params.rewards,
      createdBy: params.createdBy ?? null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Getters ---
  get id(): bigint {
    return this.props.id;
  }
  get code(): string {
    return this.props.code;
  }
  get status(): CouponStatus {
    return this.props.status;
  }
  get rewards(): CouponRewardProps[] {
    return [...this.props.rewards];
  }
  get usageCount(): number {
    return this.props.usageCount;
  }
  get createdBy(): bigint | null {
    return this.props.createdBy;
  }
  get updatedBy(): bigint | null {
    return this.props.updatedBy;
  }

  // --- Domain Logic ---

  /**
   * 시간을 기준으로 한 상태 유효성 검증
   */
  public isTimeValid(now: Date = new Date()): boolean {
    if (this.props.startsAt && now < this.props.startsAt) return false;
    if (this.props.expiresAt && now > this.props.expiresAt) return false;
    return true;
  }

  /**
   * 쿠폰 정보 수정 (Admin Audit 포함)
   */
  public update(
    params: Partial<
      Pick<
        CouponProps,
        'metadata' | 'isAllowlistOnly' | 'maxUsage' | 'maxUsagePerUser' | 'startsAt' | 'expiresAt'
      >
    >,
    adminId: bigint,
  ): void {
    if (params.metadata !== undefined) this.props.metadata = params.metadata;
    if (params.isAllowlistOnly !== undefined) this.props.isAllowlistOnly = params.isAllowlistOnly;
    if (params.maxUsage !== undefined) this.props.maxUsage = params.maxUsage;
    if (params.maxUsagePerUser !== undefined) this.props.maxUsagePerUser = params.maxUsagePerUser;
    if (params.startsAt !== undefined) this.props.startsAt = params.startsAt;
    if (params.expiresAt !== undefined) this.props.expiresAt = params.expiresAt;

    this.props.updatedBy = adminId;
    this.props.updatedAt = new Date();
  }

  /**
   * 상태 강제 변경 (Admin 사용)
   */
  public updateStatus(status: CouponStatus, adminId: bigint): void {
    this.props.status = status;
    this.props.updatedBy = adminId;
    this.props.updatedAt = new Date();
  }

  /**
   * 보상 목록 갱신 (Admin 사용)
   */
  public updateRewards(rewards: CouponRewardProps[], adminId: bigint): void {
    this.props.rewards = rewards;
    this.props.updatedBy = adminId;
    this.props.updatedAt = new Date();
  }

  /**
   * 시간에 따른 상태 갱신 (EXPIRED 처리 등)
   */
  public refreshStatus(now: Date = new Date()): void {
    if (this.props.status === CouponStatus.VOIDED) return;

    if (this.props.expiresAt && now > this.props.expiresAt && this.props.status === CouponStatus.ACTIVE) {
      this.props.status = CouponStatus.EXPIRED;
    }

    if (this.props.maxUsage > 0 && this.props.usageCount >= this.props.maxUsage && this.props.status === CouponStatus.ACTIVE) {
      this.props.status = CouponStatus.EXHAUSTED;
    }
  }

  /**
   * 쿠폰 사용 가능 여부 검증
   * @param userId 유저 ID
   * @param userUsageCount 해당 유저의 이 쿠폰 사용 횟수
   * @param isUserInAllowlist 유저가 허용 리스트에 포함되어 있는지 여부
   * @param now 현재 시간 (테스트 용도로 주입 가능)
   */
  public validateEligibility(params: {
    userId: bigint;
    userUsageCount: number;
    isUserInAllowlist: boolean;
    now?: Date;
  }): void {
    const { userUsageCount, isUserInAllowlist, now = new Date() } = params;

    // 실시간 상태 보정
    this.refreshStatus(now);

    // 1. 기본 상태 체크
    if (this.props.status === CouponStatus.VOIDED) {
      throw new CouponVoidedException();
    }
    if (this.props.status === CouponStatus.EXPIRED) {
      throw new CouponExpiredException();
    }
    if (this.props.status === CouponStatus.EXHAUSTED) {
      throw new CouponExhaustedException();
    }
    if (this.props.status !== CouponStatus.ACTIVE) {
      throw new CouponInactiveException();
    }

    // 2. 기간 체크 (refreshStatus에서 이미 EXPIRED는 걸러짐)
    if (this.props.startsAt && now < this.props.startsAt) {
      throw new CouponNotStartedException();
    }

    // 3. 유저당 사용 횟수 체크
    if (userUsageCount >= this.props.maxUsagePerUser) {
      throw new CouponUserUsageExceededException();
    }

    // 4. 허용 리스트 체크
    if (this.props.isAllowlistOnly && !isUserInAllowlist) {
      throw new CouponAllowlistOnlyException();
    }
  }

  /**
   * 쿠폰 사용 횟수 증가
   */
  public incrementUsage(): void {
    this.props.usageCount += 1;

    // 만약 최대 횟수에 도달했다면 상태를 EXHAUSTED로 변경 고려할 수 있으나, 
    // 보통은 조회 시점에 maxUsage와 비교하여 판단하므로 명시적 상태 변경은 비즈니스 요구사항에 따라 결정합니다.
    if (this.props.maxUsage > 0 && this.props.usageCount >= this.props.maxUsage) {
      this.props.status = CouponStatus.EXHAUSTED;
    }
  }

  /**
   * 쿠폰 무효화
   */
  public void(): void {
    this.props.status = CouponStatus.VOIDED;
  }

  public toProps(): CouponProps {
    return { ...this.props };
  }
}
