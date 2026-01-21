import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, IsIn } from 'class-validator';
import { ExchangeCurrencyCode, WalletBalanceType, AdjustmentReasonCode } from '@prisma/client';
import { UpdateOperation } from '../../../../domain/wallet.constant';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class AdjustBalanceRequestDto {
    @ApiProperty({ description: 'User ID / 사용자 ID', example: '1' })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        enum: WALLET_CURRENCIES,
        description: 'Currency Code / 통화 코드',
        example: ExchangeCurrencyCode.KRW,
    })
    @IsIn(WALLET_CURRENCIES, {
        message: 'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
    })
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({
        description: 'Adjustment Amount (Positive absolute value only) / 조정 금액 (부호 없는 양의 절대값만 입력)',
        example: '1000.00',
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d+(\.\d+)?$/, {
        message: 'Amount must be a positive number without signs (+, -).'
    })
    amount: string;

    @ApiProperty({
        enum: UpdateOperation,
        description: 'Operation Type (ADD/SUBTRACT) / 연산 타입 (추가/차감)',
    })
    @IsEnum(UpdateOperation)
    @IsNotEmpty()
    operation: UpdateOperation;

    @ApiProperty({
        enum: WalletBalanceType,
        description: 'Target Balance Type / 대상 잔액 타입 (CASH/BONUS 등)',
    })
    @IsEnum(WalletBalanceType)
    @IsNotEmpty()
    balanceType: WalletBalanceType;

    @ApiProperty({
        enum: AdjustmentReasonCode,
        description: 'Adjustment Reason Code / 조정 사유 코드',
    })
    @IsEnum(AdjustmentReasonCode)
    @IsNotEmpty()
    reasonCode: AdjustmentReasonCode;

    @ApiPropertyOptional({ description: 'Remark / 비고 (관리자 상세 메모)' })
    @IsOptional()
    @IsString()
    remark?: string;
}
