import { ApiProperty } from '@nestjs/swagger';
import { RewardStatus, RewardItemType, RewardSourceType, ExchangeCurrencyCode, WageringTargetType } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';

export class UserRewardResponseDto {
    @ApiProperty({ description: 'Reward ID (Sqids encoded) / 보상 고유 ID', example: 'abc123xy' })
    id: string;

    @ApiProperty({ description: 'Source Type / 지급 소스 유형', enum: RewardSourceType })
    sourceType: RewardSourceType;

    @ApiProperty({ description: 'Reward Type / 보상 유형', enum: RewardItemType })
    rewardType: RewardItemType;

    @ApiProperty({ description: 'Currency / 통화', enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Amount / 금액', example: '100.00' })
    amount: string;

    @ApiProperty({ description: 'Wagering Target Type / 롤링 조건 대상', enum: WageringTargetType })
    wageringTargetType: WageringTargetType;

    @ApiProperty({ description: 'Wagering Multiplier / 롤링 배수 (수령 시 적용됨)', example: '3.00', required: false })
    wageringMultiplier?: string | null;

    @ApiProperty({ description: 'Wagering Expiry Days / 롤링 만료 조건 기한(일)', example: 7, required: false })
    wageringExpiryDays?: number | null;

    @ApiProperty({ description: 'Status / 보상 상태', enum: RewardStatus })
    status: RewardStatus;

    @ApiProperty({ description: 'Expires At / 만료 예정 시각', type: Date, required: false })
    expiresAt?: Date | null;

    @ApiProperty({ description: 'Claimed At / 수령 일시', type: Date, required: false })
    claimedAt?: Date | null;

    @ApiProperty({ description: 'Created At / 생성 일시', type: Date })
    createdAt: Date;
}

export class PaginatedUserRewardResponseDto extends PaginatedResponseDto<UserRewardResponseDto> {
    @ApiProperty({ type: [UserRewardResponseDto] })
    declare data: UserRewardResponseDto[];
}
