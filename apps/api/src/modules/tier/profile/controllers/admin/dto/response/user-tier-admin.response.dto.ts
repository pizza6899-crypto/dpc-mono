import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';
import { EffectiveBenefitsAdminResponseDto } from './user-tier-benefits-admin.response.dto';

export class UserTierAdminResponseDto {
    @ApiProperty({ description: 'Record ID / 레코드 고유 ID' })
    id: string;

    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ description: 'Tier ID / 티어 ID' })
    tierId: string;

    @ApiProperty({ description: 'Tier Name / 티어 이름' })
    tierName: string;

    @ApiProperty({ description: 'Cumulative rolling amount (lifetime) / 누적 롤링 금액 (전체 가간)' })
    totalEffectiveRollingUsd: string;

    @ApiProperty({ description: 'Rolling amount for the current evaluation period / 현재 심사 주기 내 롤링 금액' })
    currentPeriodRollingUsd: string;

    @ApiProperty({ description: 'Deposit amount for the current evaluation period / 현재 심사 주기 내 입금 금액' })
    currentPeriodDepositUsd: string;

    @ApiProperty({ description: 'Date of the last evaluation / 마지막 심사 수행 일시' })
    lastEvaluationAt: Date;

    @ApiProperty({ description: 'Highest rank ever reached / 역대 최고 달성 등급 rank' })
    highestPromotedRank: number;

    @ApiProperty({ nullable: true, description: 'Date when the last promotion bonus was received / 마지막 승급 보너스 수령 일시' })
    lastBonusReceivedAt: Date | null;

    @ApiProperty({ enum: UserTierStatus, description: 'Current user tier status / 현재 유저 티어 상태 (ACTIVE, GRACE, LOCKED)' })
    status: UserTierStatus;

    @ApiProperty({ nullable: true, description: 'End date of the grace period / 강등 유예 종료 일시' })
    graceEndsAt: Date | null;

    @ApiProperty({ description: 'Date of the last tier change / 마지막 티어 변경 일시' })
    lastTierChangedAt: Date;

    @ApiProperty({ nullable: true, description: 'Custom comp rate override / 커스텀 컴프 요율 오버라이드' })
    customCompRate: string | null;

    @ApiProperty({ nullable: true, description: 'Custom lossback rate override / 커스텀 손실 캐시백 요율 오버라이드' })
    customLossbackRate: string | null;

    @ApiProperty({ nullable: true, description: 'Custom rakeback rate override / 커스텀 롤링 레이크백 요율 오버라이드' })
    customRakebackRate: string | null;

    @ApiProperty({ nullable: true, description: 'Custom reload bonus rate override / 커스텀 리로드 보너스 요율 오버라이드' })
    customReloadBonusRate: string | null;

    @ApiProperty({ nullable: true, description: 'Custom daily withdrawal limit (USD) / 커스텀 일일 출금 한도 (USD)' })
    customWithdrawalLimitUsd: string | null;

    @ApiProperty({ nullable: true, description: 'Custom unlimited withdrawal flag / 커스텀 무제한 출금 여부' })
    isCustomWithdrawalUnlimited: boolean | null;

    @ApiProperty({ nullable: true, description: 'Custom dedicated manager flag / 커스텀 전담 매니저 제공 여부' })
    isCustomDedicatedManager: boolean | null;

    @ApiProperty({ nullable: true, description: 'Custom VIP event eligibility / 커스텀 VIP 이벤트 대상 여부' })
    isCustomVipEventEligible: boolean | null;

    @ApiProperty({ description: 'Whether the user is eligible for promotion bonuses / 승급 보너스 지급 대상 여부' })
    isBonusEligible: boolean;

    @ApiProperty({ nullable: true, description: 'Next scheduled evaluation date / 다음 심사 예정 일시' })
    nextEvaluationAt: Date | null;

    @ApiProperty({ nullable: true, description: 'Admin note for the user tier / 관리자 메모' })
    note: string | null;

    @ApiProperty({ nullable: true, description: 'Date when the demotion warning was issued / 강등 경고 발생 일시' })
    demotionWarningIssuedAt: Date | null;

    @ApiProperty({ nullable: true, description: 'Target tier ID if demoted / 강등 시 대상 티어 ID' })
    demotionWarningTargetTierId: string | null;

    @ApiProperty({ nullable: true, description: 'Target tier name if demoted / 강등 시 대상 티어 이름' })
    demotionWarningTargetTierName: string | null;

    @ApiProperty({ description: 'Final effective benefits including overrides / 오버라이드가 반영된 실질 혜택 정보' })
    currentBenefits: EffectiveBenefitsAdminResponseDto;
}
