import { ApiProperty } from '@nestjs/swagger';

export class CryptoWithdrawOptionDto {
  @ApiProperty({ description: 'Config ID (Encoded)', example: 'wcc_abc123' })
  id: string;

  @ApiProperty({ description: 'Symbol', example: 'USDT' })
  symbol: string;

  @ApiProperty({ description: 'Network', example: 'TRC20' })
  network: string;

  @ApiProperty({ description: 'Minimum withdrawal amount', example: '10' })
  minAmount: string;

  @ApiProperty({
    description: 'Maximum withdrawal amount',
    example: '10000',
    nullable: true,
  })
  maxAmount: string | null;

  @ApiProperty({ description: 'Fixed fee amount', example: '1' })
  feeFixed: string;

  @ApiProperty({ description: 'Fee rate (percentage)', example: '0.001' })
  feeRate: string;
}

export class BankWithdrawOptionDto {
  @ApiProperty({ description: 'Config ID (Encoded)', example: 'wbc_abc123' })
  id: string;

  @ApiProperty({ description: 'Currency', example: 'KRW' })
  currency: string;

  @ApiProperty({ description: 'Bank name', example: '신한은행' })
  bankName: string;

  @ApiProperty({ description: 'Minimum withdrawal amount', example: '10000' })
  minAmount: string;

  @ApiProperty({
    description: 'Maximum withdrawal amount',
    example: '10000000',
    nullable: true,
  })
  maxAmount: string | null;

  @ApiProperty({ description: 'Fixed fee amount', example: '500' })
  feeFixed: string;

  @ApiProperty({ description: 'Fee rate (percentage)', example: '0' })
  feeRate: string;
}

export class WithdrawalOptionsResponseDto {
  @ApiProperty({
    type: [CryptoWithdrawOptionDto],
    description: 'Available crypto withdrawal options',
  })
  crypto: CryptoWithdrawOptionDto[];

  @ApiProperty({
    type: [BankWithdrawOptionDto],
    description: 'Available bank withdrawal options',
  })
  bank: BankWithdrawOptionDto[];
}
