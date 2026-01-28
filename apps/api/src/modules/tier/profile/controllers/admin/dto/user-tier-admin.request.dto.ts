import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserTierCustomRequestDto {
    @ApiProperty({ nullable: true, required: false })
    customCompRate?: number;

    @ApiProperty({ nullable: true, required: false })
    customLossbackRate?: number;

    @ApiProperty({ nullable: true, required: false })
    customRakebackRate?: number;

    @ApiProperty({ nullable: true, required: false })
    customReloadBonusRate?: number;

    @ApiProperty({ nullable: true, required: false })
    customWithdrawalLimitUsd?: number;

    @ApiProperty({ nullable: true, required: false })
    isCustomWithdrawalUnlimited?: boolean;

    @ApiProperty({ nullable: true, required: false })
    isCustomDedicatedManager?: boolean;

    @ApiProperty({ nullable: true, required: false })
    isCustomVipEventEligible?: boolean;
}

export class ForceUpdateTierRequestDto {
    @ApiProperty()
    targetTierId: string;

    @ApiProperty()
    reason: string;
}

export class TierDistributionResponseDto {
    @ApiProperty()
    tierId: string;

    @ApiProperty()
    tierName: string;

    @ApiProperty()
    count: number;
}
