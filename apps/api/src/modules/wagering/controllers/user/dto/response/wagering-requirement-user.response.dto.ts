import { Expose, Transform } from 'class-transformer';
import type { ExchangeCurrencyCode, WageringStatus } from '@repo/database';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementUserResponseDto {
    @Expose()
    @ApiProperty({ description: 'UID' })
    uid: string;

    @Expose()
    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

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
    @ApiProperty({ description: 'Status' })
    status: WageringStatus;

    @Expose()
    @ApiProperty({ description: 'Expires At' })
    expiresAt: Date | null;

    @Expose()
    @ApiProperty({ description: 'Created At' })
    createdAt: Date;
}
