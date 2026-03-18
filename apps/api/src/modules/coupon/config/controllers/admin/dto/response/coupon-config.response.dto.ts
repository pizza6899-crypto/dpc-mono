import { ApiProperty } from '@nestjs/swagger';
import { CouponConfig } from '../../../domain/coupon-config.entity';

export class CouponConfigResponseDto {
  @ApiProperty({ description: '쿠폰 시스템 활성화 여부' })
  isCouponEnabled: boolean;

  @ApiProperty({ description: '유저당 일일 최대 시도 횟수' })
  maxDailyAttemptsPerUser: number;

  @ApiProperty({ description: '기본 유효 기간 (일)' })
  defaultExpiryDays: number;

  @ApiProperty({ description: '마지막 수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '마지막 수정자 ID', nullable: true })
  updatedBy: string | null;

  static fromEntity(config: CouponConfig): CouponConfigResponseDto {
    const props = config.toProps();
    return {
      isCouponEnabled: props.isCouponEnabled,
      maxDailyAttemptsPerUser: props.maxDailyAttemptsPerUser,
      defaultExpiryDays: props.defaultExpiryDays,
      updatedAt: props.updatedAt,
      updatedBy: props.updatedBy?.toString() || null,
    };
  }
}
