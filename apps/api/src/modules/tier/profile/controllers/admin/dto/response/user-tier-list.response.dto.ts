import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';
import { EffectiveBenefitsAdminResponseDto } from './user-tier-benefits-admin.response.dto';

export class UserTierListItemResponseDto {
    @ApiProperty({ description: 'Unique identifier for the record / 레코드 고유 ID' })
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

    @ApiProperty({ enum: UserTierStatus, description: 'Current user tier status / 현재 유저 티어 상태 (ACTIVE, GRACE, LOCKED)' })
    status: UserTierStatus;

    @ApiProperty({ description: 'Date of the last tier change / 마지막 티어 변경 일시' })
    lastTierChangedAt: Date;

    @ApiProperty({ nullable: true, description: 'Next scheduled evaluation date / 다음 심사 예정 일시' })
    nextEvaluationAt: Date | null;

    @ApiProperty({ description: 'Highest priority (tier) ever reached / 역대 최고 달성 등급 우선순위' })
    highestPromotedPriority: number;

    @ApiProperty({ nullable: true, description: 'Date when the last promotion bonus was received / 마지막 승급 보너스 수령 일시' })
    lastBonusReceivedAt: Date | null;

    @ApiProperty({ nullable: true, description: 'End date of the grace period / 강등 유예 종료 일시' })
    graceEndsAt: Date | null;

    @ApiProperty({ description: 'Whether the user is eligible for promotion bonuses / 승급 보너스 지급 대상 여부' })
    isBonusEligible: boolean;

    @ApiProperty({ nullable: true, description: 'Admin note for the user tier / 관리자 메모' })
    note: string | null;

    @ApiProperty({ nullable: true, description: 'Date when the demotion warning was issued / 강등 경고 발생 일시' })
    demotionWarningIssuedAt: Date | null;

    @ApiProperty({ nullable: true, description: 'Target tier ID if demoted / 강등 시 대상 티어 ID' })
    demotionWarningTargetTierId: string | null;

    @ApiProperty({ nullable: true, description: 'Target tier name if demoted / 강등 시 대상 티어 이름' })
    demotionWarningTargetTierName: string | null;

    @ApiProperty({ description: 'Summary: Has any custom benefit overrides / 커스텀 혜택 오버라이드 존재 여부' })
    hasCustomOverrides: boolean;

    @ApiProperty({ description: 'Final effective benefits including overrides / 오버라이드가 반영된 실질 혜택 정보' })
    currentBenefits: EffectiveBenefitsAdminResponseDto;
}
