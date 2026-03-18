import {
  CouponConfigNegativeValueException,
  InvalidCouponConfigException,
} from './coupon-config.exception';

export interface CouponConfigProps {
  id: number;
  isCouponEnabled: boolean;
  maxDailyAttemptsPerUser: number;
  defaultExpiryDays: number;
  updatedAt: Date;
  updatedBy: bigint | null;
}

export class CouponConfig {
  public static readonly SINGLETON_ID = 1;

  private constructor(private readonly props: CouponConfigProps) {
    this.validate(props);
  }

  static fromPersistence(props: CouponConfigProps): CouponConfig {
    return new CouponConfig(props);
  }

  get id(): number {
    return this.props.id;
  }
  get isCouponEnabled(): boolean {
    return this.props.isCouponEnabled;
  }
  get maxDailyAttemptsPerUser(): number {
    return this.props.maxDailyAttemptsPerUser;
  }
  get defaultExpiryDays(): number {
    return this.props.defaultExpiryDays;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get updatedBy(): bigint | null {
    return this.props.updatedBy;
  }

  update(
    params: Partial<
      Pick<
        CouponConfigProps,
        'isCouponEnabled' | 'maxDailyAttemptsPerUser' | 'defaultExpiryDays'
      >
    >,
    adminId: bigint,
  ): void {
    if (params.isCouponEnabled !== undefined) {
      this.props.isCouponEnabled = params.isCouponEnabled;
    }
    if (params.maxDailyAttemptsPerUser !== undefined) {
      this.props.maxDailyAttemptsPerUser = params.maxDailyAttemptsPerUser;
    }
    if (params.defaultExpiryDays !== undefined) {
      this.props.defaultExpiryDays = params.defaultExpiryDays;
    }

    this.validate(this.props);

    this.props.updatedBy = adminId;
    this.props.updatedAt = new Date();
  }

  private validate(props: CouponConfigProps): void {
    if (props.id !== CouponConfig.SINGLETON_ID) {
      throw new InvalidCouponConfigException(`Config ID must be ${CouponConfig.SINGLETON_ID}`);
    }
    if (props.maxDailyAttemptsPerUser < 0) {
      throw new CouponConfigNegativeValueException('maxDailyAttemptsPerUser');
    }
    if (props.defaultExpiryDays <= 0) {
      throw new InvalidCouponConfigException('defaultExpiryDays must be greater than 0');
    }
  }

  toProps(): CouponConfigProps {
    return { ...this.props };
  }
}
