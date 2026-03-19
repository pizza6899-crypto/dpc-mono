import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExchangeCurrencyCode,
  RewardItemType,
  RewardSourceType,
  WageringTargetType,
  RewardStatus,
} from '@prisma/client';

export class AdminRewardResponseDto {
  @ApiProperty({ description: 'Reward ID / 보상 ID (String as BigInt)' })
  id: string;

  @ApiProperty({ description: 'User ID / 사용자 ID (String as BigInt)' })
  userId: string;

  @ApiProperty({
    enum: RewardSourceType,
    description: 'Source Type / 출처 타입',
  })
  sourceType: RewardSourceType;

  @ApiPropertyOptional({ description: 'Source ID / 출처 ID' })
  sourceId?: string | null;

  @ApiProperty({ enum: RewardItemType, description: 'Reward Type / 보상 타입' })
  rewardType: RewardItemType;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency / 통화' })
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Amount / 보상 금액' })
  amount: string;

  @ApiPropertyOptional({
    enum: WageringTargetType,
    description: 'Wagering Target Type / 롤링 대상 타입',
  })
  wageringTargetType?: WageringTargetType | null;

  @ApiPropertyOptional({ description: 'Wagering Multiplier / 롤링 배수' })
  wageringMultiplier?: string | null;

  @ApiPropertyOptional({ description: 'Wagering Expiry Days / 롤링 만료 일수' })
  wageringExpiryDays?: number | null;

  @ApiPropertyOptional({
    description: 'Max Cash Conversion / 최대 현금 전환 기준',
  })
  maxCashConversion?: string | null;

  @ApiProperty({ description: 'Is Forfeitable / 포기 가능 여부' })
  isForfeitable: boolean;

  @ApiProperty({
    enum: RewardStatus,
    description: 'Status / 상태 (PENDING, CLAIMED, EXPIRED)',
  })
  status: RewardStatus;

  @ApiPropertyOptional({ description: 'Expires At / 만료 일시' })
  expiresAt?: Date | null;

  @ApiPropertyOptional({ description: 'Claimed At / 수령 일시' })
  claimedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Metadata / 메타데이터' })
  metadata?: any;

  @ApiPropertyOptional({ description: 'Reason / 사유' })
  reason?: string | null;

  @ApiProperty({ description: 'Created At / 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At / 수정 일시' })
  updatedAt: Date;
}

import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';

export class PaginatedAdminRewardResponseDto extends PaginatedResponseDto<AdminRewardResponseDto> {
  @ApiProperty({ type: [AdminRewardResponseDto] })
  declare data: AdminRewardResponseDto[];
}
