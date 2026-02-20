import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RequestBankWithdrawalDto {
  @ApiProperty({
    description: 'Withdrawal amount',
    example: '1000000',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'Bank config ID (Encoded)',
    example: 'wbc_abc123',
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
