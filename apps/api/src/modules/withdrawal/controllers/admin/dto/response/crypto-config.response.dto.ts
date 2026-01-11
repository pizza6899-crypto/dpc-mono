import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalCryptoConfigResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    symbol: string;

    @ApiProperty()
    network: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    minWithdrawAmount: string;

    @ApiProperty({ nullable: true })
    maxWithdrawAmount: string | null;

    @ApiProperty({ nullable: true })
    autoProcessLimit: string | null;

    @ApiProperty()
    withdrawFeeFixed: string;

    @ApiProperty()
    withdrawFeeRate: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
