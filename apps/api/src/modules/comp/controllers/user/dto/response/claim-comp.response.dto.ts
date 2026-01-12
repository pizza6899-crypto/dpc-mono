import { ApiProperty } from '@nestjs/swagger';

export class ClaimCompResponseDto {
    @ApiProperty({ description: 'Success flag' })
    success: boolean;

    @ApiProperty({ description: 'Claimed amount as cash', example: '1000.00' })
    claimedAmount: string;

    @ApiProperty({ description: 'Remaining comp points balance', example: '500.50' })
    newCompBalance: string;

    @ApiProperty({ description: 'New cash balance after claim', example: '10000.00' })
    newCashBalance: string;
}
