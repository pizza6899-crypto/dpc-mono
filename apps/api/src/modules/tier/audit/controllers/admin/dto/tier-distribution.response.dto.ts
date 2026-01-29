import { ApiProperty } from '@nestjs/swagger';

export class TierDistributionResponseDto {
    @ApiProperty({ description: 'Tier ID / 티어 ID' })
    tierId: string;

    @ApiProperty({ description: 'Tier Name / 티어 이름' })
    tierName: string;

    @ApiProperty({ description: 'User Count / 해당 티어 유저 수' })
    count: number;
}
