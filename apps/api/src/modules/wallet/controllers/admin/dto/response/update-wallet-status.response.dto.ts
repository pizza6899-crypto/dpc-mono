import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserWalletStatus } from '@prisma/client';

export class UpdateWalletStatusResponseDto {
    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ enum: UserWalletStatus, description: 'Current Wallet Status / 현재 지갑 상태' })
    status: UserWalletStatus;

    @ApiProperty({ description: 'Last Updated At / 최종 수정 일시' })
    updatedAt: Date;
}
