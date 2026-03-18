import { ApiProperty } from '@nestjs/swagger';

export class CouponConfigResponseDto {
  @ApiProperty({
    description: 'Is Coupon Enabled / 쿠폰 시스템 활성화 여부',
    example: true,
  })
  isCouponEnabled: boolean;

  @ApiProperty({
    description: 'Max Daily Attempts Per User / 유저당 일일 최대 시도 횟수',
    example: 10,
  })
  maxDailyAttemptsPerUser: number;

  @ApiProperty({
    description: 'Default Expiry Days / 기본 유효 기간 (일)',
    example: 30,
  })
  defaultExpiryDays: number;

  @ApiProperty({
    description: 'Updated At / 마지막 수정일',
    example: '2024-03-18T14:49:10Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Updated By / 마지막 수정자 ID',
    nullable: true,
    example: '123456789012345678',
  })
  updatedBy: string | null;
}
