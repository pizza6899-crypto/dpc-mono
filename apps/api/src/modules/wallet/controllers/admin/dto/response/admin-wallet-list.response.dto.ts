import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserWalletStatus } from '@prisma/client';

export class AdminWalletResponseDto {
    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Cash Balance / 현금 잔액' })
    cashBalance: string;

    @ApiProperty({ description: 'Bonus Balance / 보너스 잔액' })
    bonusBalance: string;



    @ApiProperty({ description: 'Locked Balance / 잠긴 잔액' })
    lockedBalance: string;

    @ApiProperty({ description: 'Vault Balance / 금고 잔액' })
    vaultBalance: string;

    @ApiProperty({ description: 'Total Available Balance / 총 가용 잔액' })
    totalBalance: string;

    @ApiProperty({ enum: UserWalletStatus, description: 'Wallet Status / 지갑 상태' })
    status: UserWalletStatus;

    @ApiProperty({ description: 'Last Updated At / 최종 수정 일시' })
    updatedAt: Date;
}
