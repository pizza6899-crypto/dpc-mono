import { Expose, Transform } from 'class-transformer';
import type { ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementAdminResponseDto {
    @Expose()
    @ApiProperty({ description: 'ID', type: String })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    id: bigint;

    @Expose()
    @ApiProperty({ description: 'User ID', type: String })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    userId: bigint;

    @Expose()
    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @Expose()
    @ApiProperty({ description: 'Source Type (DEPOSIT, PROMOTION_BONUS, TIER_BONUS)' })
    sourceType: WageringSourceType;

    @Expose()
    @ApiProperty({ description: 'Required Amount (목표 롤링 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    requiredAmount: string;

    @Expose()
    @ApiProperty({ description: 'Fulfilled Amount (현재까지 달성한 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    fulfilledAmount: string;

    @Expose()
    @ApiProperty({ description: 'Remaining Amount (남은 롤링 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    remainingAmount: string;

    @Expose()
    @ApiProperty({ description: 'Principal Amount (원본 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    principalAmount: string;

    @Expose()
    @ApiProperty({ description: 'Multiplier (적용 배수)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    multiplier: string;

    @Expose()
    @ApiProperty({ description: 'Locked Amount (묶여있는 총 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    lockedAmount: string;

    @Expose()
    @ApiProperty({ description: 'Max Cash Conversion (현금 전환 상한)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    maxCashConversion: string | null;

    @Expose()
    @ApiProperty({ description: 'Converted Amount (실제 전환된 금액)' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    convertedAmount: string | null;

    @Expose()
    @ApiProperty({ description: 'Is Paused (일시 정지 여부)' })
    isPaused: boolean;

    @Expose()
    @ApiProperty({ description: 'Is Auto Cancelable (오링 자동 취소 허용 여부)' })
    isAutoCancelable: boolean;

    @Expose()
    @ApiProperty({ description: 'Status' })
    status: WageringStatus;

    @Expose()
    @ApiProperty({ description: 'Priority' })
    priority: number;

    @Expose()
    @ApiProperty({ description: 'Created At' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Updated At' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Expires At', required: false })
    expiresAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Last Contributed At', required: false })
    lastContributedAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Completed At', required: false })
    completedAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Cancelled At', required: false })
    cancelledAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Cancellation Note', required: false })
    cancellationNote: string | null;

    @Expose()
    @ApiProperty({ description: 'Cancellation Reason Type', required: false })
    cancellationReasonType: string | null;

    @Expose()
    @ApiProperty({ description: 'Cancelled By', required: false })
    cancelledBy: string | null;

    @Expose()
    @ApiProperty({ description: 'Balance At Cancellation', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    balanceAtCancellation: string | null;

    @Expose()
    @ApiProperty({ description: 'Forfeited Amount', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    forfeitedAmount: string | null;

    @Expose()
    @ApiProperty({ description: 'Deposit Detail ID', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    depositDetailId: bigint | null;

    @Expose()
    @ApiProperty({ description: 'User Promotion ID', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    userPromotionId: bigint | null;

    @Expose()
    @ApiProperty({ description: 'Auto Cancel Threshold (오링 기준 잔액)', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    autoCancelThreshold: string | null;
}
