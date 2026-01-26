import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExchangeCurrencyCode, UserWalletStatus } from '@prisma/client';

export class UpdateWalletStatusRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({ enum: UserWalletStatus, description: 'New Wallet Status / 변경할 지갑 상태' })
    @IsEnum(UserWalletStatus)
    @IsNotEmpty()
    newStatus: UserWalletStatus;

    @ApiPropertyOptional({ description: 'Reason for Status Change / 상태 변경 사유' })
    @IsOptional()
    @IsString()
    reason?: string;
}
