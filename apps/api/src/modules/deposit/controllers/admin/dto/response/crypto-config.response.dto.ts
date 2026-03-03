import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CryptoConfigResponseDto {
  @ApiProperty({ description: 'ID' })
  id: string;


  @ApiProperty({ description: 'Symbol' })
  symbol: string;

  @ApiProperty({ description: 'Network' })
  network: string;

  @ApiProperty({ description: 'Active Status' })
  isActive: boolean;

  @ApiProperty({ description: 'Minimum Deposit Amount' })
  minDepositAmount: string;

  @ApiProperty({ description: 'Deposit Fee Rate' })
  depositFeeRate: string;

  @ApiProperty({ description: 'Confirmations Needed' })
  confirmations: number;

  @ApiPropertyOptional({ description: 'Contract Address' })
  contractAddress: string | null;

  @ApiProperty({ description: 'Created At' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At' })
  updatedAt: Date;
}
