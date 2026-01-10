import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestBankWithdrawalDto {
    @ApiProperty({
        description: 'Withdrawal amount',
        example: '1000000',
    })
    @IsString()
    @IsNotEmpty()
    amount: string;

    @ApiProperty({
        description: 'Bank config ID',
        example: '1',
    })
    @IsString()
    @IsNotEmpty()
    bankConfigId: string;

    @ApiProperty({
        description: 'Bank name',
        example: '신한은행',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    bankName: string;

    @ApiProperty({
        description: 'Bank account number',
        example: '110-123-456789',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    accountNumber: string;

    @ApiProperty({
        description: 'Account holder name',
        example: '홍길동',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    accountHolder: string;
}
