import type { ExchangeCurrencyCode, WageringStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementUserResponseDto {
    @ApiProperty({ description: 'Requirement ID (Sqid)' })
    id: string;

    @ApiProperty({ description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Required Amount' })
    requiredAmount: string;

    @ApiProperty({ description: 'Current Amount' })
    currentAmount: string;

    @ApiProperty({ description: 'Remaining Amount' })
    remainingAmount: string;

    @ApiProperty({ description: 'Status' })
    status: WageringStatus;

    @ApiProperty({ description: 'Expires At' })
    expiresAt: Date | null;

    @ApiProperty({ description: 'Created At' })
    createdAt: Date;
}
