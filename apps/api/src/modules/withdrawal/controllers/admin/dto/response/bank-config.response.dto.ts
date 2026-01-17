import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class WithdrawalBankConfigResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty()
    bankName: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    minWithdrawAmount: string;

    @ApiProperty({ nullable: true })
    maxWithdrawAmount: string | null;

    @ApiProperty()
    withdrawFeeFixed: string;

    @ApiProperty()
    withdrawFeeRate: string;

    @ApiProperty({ nullable: true })
    description: string | null;

    @ApiProperty({ nullable: true })
    notes: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
