import { ApiProperty } from '@nestjs/swagger';

export class TierRewardResponseDto {
    @ApiProperty({ description: 'Reward ID / 보상 ID (Sqids Encoded)' })
    id: string;

    @ApiProperty({ description: 'Tier Name / 달성한 티어 이름' })
    tierName: string;

    @ApiProperty({ description: 'Bonus Amount / 보너스 금액' })
    amount: string;

    @ApiProperty({ description: 'Currency / 통화', default: 'USD' })
    currency: string;

    @ApiProperty({ description: 'Wagering Requirement Multiplier / 베팅 조건 배수' })
    wageringMultiplier: string;

    @ApiProperty({ nullable: true, description: 'Expiration Date / 만료 일시' })
    expiresAt: Date | null;

    @ApiProperty({ description: 'Creation Date / 생성 일시' })
    createdAt: Date;
}
