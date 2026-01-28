import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';

export class NextTierProgressDto {
    @ApiProperty({ description: 'Target tier name' })
    name: string;

    @ApiProperty({ description: 'Required rolling amount for upgrade' })
    requiredRolling: string;

    @ApiProperty({ description: 'Current accumulated rolling amount' })
    currentRolling: string;

    @ApiProperty({ description: 'Remaining rolling amount needed' })
    remainingRolling: string;

    @ApiProperty({ description: 'Progress percentage for rolling (0-100)' })
    rollingProgressPercent: number;

    @ApiProperty({ description: 'Required deposit amount for upgrade' })
    requiredDeposit: string;

    @ApiProperty({ description: 'Current accumulated deposit amount' })
    currentDeposit: string;

    @ApiProperty({ description: 'Remaining deposit amount needed' })
    remainingDeposit: string;

    @ApiProperty({ description: 'Progress percentage for deposit (0-100)' })
    depositProgressPercent: number;
}

export class EffectiveBenefitsDto {
    @ApiProperty()
    compRate: string;
    @ApiProperty()
    lossbackRate: string;
    @ApiProperty()
    rakebackRate: string;
    @ApiProperty()
    reloadBonusRate: string;
    @ApiProperty()
    dailyWithdrawalLimitUsd: string;
    @ApiProperty()
    isWithdrawalUnlimited: boolean;
    @ApiProperty()
    hasDedicatedManager: boolean;
    @ApiProperty()
    isVIPEventEligible: boolean;
}

export class UserTierPublicResponseDto {
    @ApiProperty({ description: 'Tier ID' })
    id: string;

    @ApiProperty({ description: 'Tier Name' })
    name: string;

    @ApiProperty({ description: 'Tier Priority' })
    priority: number;

    @ApiProperty({ description: 'Tier Image URL', required: false, nullable: true })
    imageUrl: string | null;

    @ApiProperty({ enum: UserTierStatus })
    status: UserTierStatus;

    @ApiProperty({ description: 'Date when the tier was last changed' })
    lastChangedAt: Date;

    @ApiProperty({ description: 'Date for the next evaluation', required: false, nullable: true })
    nextEvaluationAt: Date | null;

    @ApiProperty({ description: 'Effective benefits applied to the user' })
    benefits: EffectiveBenefitsDto;

    @ApiProperty({ description: 'Progress towards the next tier', required: false, nullable: true })
    nextTierProgress: NextTierProgressDto | null;
}
