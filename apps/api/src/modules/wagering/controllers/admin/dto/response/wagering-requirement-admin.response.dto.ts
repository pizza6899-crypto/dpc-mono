import { Expose, Transform } from 'class-transformer';
import type { ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@repo/database';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementAdminResponseDto {
    @Expose()
    @ApiProperty({ description: 'ID', type: String })
    @Transform(({ value }) => value.toString())
    id: bigint;

    @Expose()
    @ApiProperty({ description: 'User ID', type: String })
    @Transform(({ value }) => value.toString())
    userId: bigint;

    @Expose()
    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @Expose()
    @ApiProperty({ description: 'Source Type (DEPOSIT, PROMOTION_BONUS)' })
    sourceType: WageringSourceType;

    @Expose()
    @ApiProperty({ description: 'Required Amount' })
    requiredAmount: string;

    @Expose()
    @ApiProperty({ description: 'Current Amount' })
    currentAmount: string;

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
}
