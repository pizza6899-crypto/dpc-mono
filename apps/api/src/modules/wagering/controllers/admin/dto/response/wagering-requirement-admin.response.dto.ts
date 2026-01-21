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
    @ApiProperty({ description: 'UID' })
    uid: string;

    @Expose()
    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @Expose()
    @ApiProperty({ description: 'Source Type (DEPOSIT, PROMOTION_BONUS)' })
    sourceType: WageringSourceType;

    @Expose()
    @ApiProperty({ description: 'Required Amount' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    requiredAmount: string;

    @Expose()
    @ApiProperty({ description: 'Current Amount' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    currentAmount: string;

    @Expose()
    @ApiProperty({ description: 'Remaining Amount' })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    remainingAmount: string;

    @Expose()
    @ApiProperty({ description: 'Status (ACTIVE, COMPLETED, CANCELLED, EXPIRED, VOIDED)' })
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
    @ApiProperty({ description: 'Completed At', required: false })
    completedAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Cancelled At', required: false })
    cancelledAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Cancellation Note', required: false })
    cancellationNote: string | null;

    @Expose()
    @ApiProperty({ description: 'Deposit Detail ID', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    depositDetailId: bigint | null;

    @Expose()
    @ApiProperty({ description: 'User Promotion ID', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    userPromotionId: bigint | null;

    @Expose()
    @ApiProperty({ description: 'Cancellation Balance Threshold', required: false })
    @Transform(({ value }) => (value != null ? value.toString() : value))
    cancellationBalanceThreshold: string | null;
}
