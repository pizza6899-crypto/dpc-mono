import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExchangeCurrencyCode, WalletStatus } from '@prisma/client';

export class UpdateWalletStatusRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({ enum: WalletStatus, description: 'New Wallet Status / 변경할 지갑 상태' })
    @IsEnum(WalletStatus)
    @IsNotEmpty()
    newStatus: WalletStatus;

    @ApiPropertyOptional({ description: 'Reason for Status Change / 상태 변경 사유' })
    @IsOptional()
    @IsString()
    reason?: string;
}
