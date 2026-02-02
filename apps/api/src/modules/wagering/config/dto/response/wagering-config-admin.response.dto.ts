import { ApiProperty } from '@nestjs/swagger';

export class WageringConfigAdminResponseDto {
    @ApiProperty({ description: 'Default bonus expiry days', example: 30 })
    defaultBonusExpiryDays: number;

    @ApiProperty({
        description: 'Currency settings (thresholds)',
        example: { KRW: { cancellationThreshold: 500 }, USD: { cancellationThreshold: 0.5 } }
    })
    currencySettings: any;

    @ApiProperty({ description: 'Enable wagering check on withdrawal', example: true })
    isWageringCheckEnabled: boolean;

    @ApiProperty({ description: 'Enable auto cancellation placement', example: true })
    isAutoCancellationEnabled: boolean;

    @ApiProperty({ description: 'Last updated at' })
    updatedAt: Date;

    @ApiProperty({ description: 'Last updated by admin ID', nullable: true })
    updatedBy: string | null;
}
