import { Expose, Transform } from 'class-transformer';
import type { ExchangeCurrencyCode, WageringStatus } from '@repo/database';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementUserResponseDto {
    @Expose()
    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @Expose()
    @ApiProperty({ description: 'Required Amount' })
    requiredAmount: string;

    @Expose()
    @ApiProperty({ description: 'Current Amount' })
    currentAmount: string;

    @Expose()
    @ApiProperty({ description: 'Status' })
    status: WageringStatus;

    @Expose()
    @ApiProperty({ description: 'Expires At' })
    expiresAt: Date | null;
}
