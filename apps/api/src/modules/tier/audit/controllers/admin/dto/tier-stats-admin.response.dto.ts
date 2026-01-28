import { ApiProperty } from '@nestjs/swagger';

export class TierDistributionResponseDto {
    @ApiProperty({ description: 'Tier ID' })
    tierId: string;

    @ApiProperty({ description: 'Tier Name' })
    tierName: string;

    @ApiProperty({ description: 'User Count' })
    count: number;
}
