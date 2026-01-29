import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';

export class NextTierProgressDto {
    @ApiProperty({ description: 'Target tier name / 대상 티어 이름' })
    name: string;

    @ApiProperty({ description: 'Required rolling amount for upgrade / 승급에 필요한 롤링 금액' })
    requiredRolling: string;

    @ApiProperty({ description: 'Current accumulated rolling amount / 현재 누적 롤링 금액' })
    currentRolling: string;

    @ApiProperty({ description: 'Remaining rolling amount needed / 남은 롤링 금액' })
    remainingRolling: string;

    @ApiProperty({ description: 'Progress percentage for rolling (0-100) / 롤링 진행률 (%)' })
    rollingProgressPercent: number;

    @ApiProperty({ description: 'Required deposit amount for upgrade / 승급에 필요한 입금 금액' })
    requiredDeposit: string;

    @ApiProperty({ description: 'Current accumulated deposit amount / 현재 누적 입금 금액' })
    currentDeposit: string;

    @ApiProperty({ description: 'Remaining deposit amount needed / 남은 입금 금액' })
    remainingDeposit: string;

    @ApiProperty({ description: 'Progress percentage for deposit (0-100) / 입금 진행률 (%)' })
    depositProgressPercent: number;
}

export class EffectiveBenefitsDto {
    @ApiProperty({ description: 'Comp rate / 컴프 요율' })
    compRate: string;

    @ApiProperty({ description: 'Lossback rate / 손실 캐시백 요율' })
    lossbackRate: string;

    @ApiProperty({ description: 'Rakeback rate / 롤링 레이크백 요율' })
    rakebackRate: string;

    @ApiProperty({ description: 'Reload bonus rate / 리로드 보너스 요율' })
    reloadBonusRate: string;

    @ApiProperty({ description: 'Daily withdrawal limit (USD) / 일일 출금 한도 (USD)' })
    dailyWithdrawalLimitUsd: string;

    @ApiProperty({ description: 'Whether withdrawal is unlimited / 무제한 출금 여부' })
    isWithdrawalUnlimited: boolean;

    @ApiProperty({ description: 'Whether has a dedicated manager / 전담 매니저 제공 여부' })
    hasDedicatedManager: boolean;

    @ApiProperty({ description: 'Whether eligible for VIP events / VIP 이벤트 대상 여부' })
    isVIPEventEligible: boolean;
}

export class UserTierResponseDto {
    @ApiProperty({ description: 'Tier ID / 티어 ID' })
    id: string;

    @ApiProperty({ description: 'Tier Name / 티어 이름' })
    name: string;

    @ApiProperty({ description: 'Tier Priority / 티어 우선순위' })
    priority: number;

    @ApiProperty({ description: 'Tier Image URL / 티어 이미지 URL', required: false, nullable: true })
    imageUrl: string | null;

    @ApiProperty({ enum: UserTierStatus, description: 'User tier status / 유저 티어 상태' })
    status: UserTierStatus;

    @ApiProperty({ description: 'Date when the tier was last changed / 마지막 티어 변경 일시' })
    lastChangedAt: Date;

    @ApiProperty({ description: 'Date for the next evaluation / 다음 심사 예정 일시', required: false, nullable: true })
    nextEvaluationAt: Date | null;

    @ApiProperty({ description: 'Effective benefits applied to the user / 유저에게 적용되는 실제 혜택' })
    benefits: EffectiveBenefitsDto;

    @ApiProperty({ description: 'Progress towards the next tier / 다음 티어 승급 진행률', required: false, nullable: true })
    nextTierProgress: NextTierProgressDto | null;
}
