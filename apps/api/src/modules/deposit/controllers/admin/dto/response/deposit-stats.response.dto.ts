// src/modules/deposit/dtos/deposit-stats.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DepositDistributionDto {
  @ApiProperty({ description: 'Crypto deposit count or ratio' })
  crypto: number;

  @ApiProperty({ description: 'Bank transfer deposit count or ratio' })
  bank: number;
}

export class DepositStatsResponseDto {
  @ApiProperty({ description: 'Total deposit amount today' })
  todayTotalAmount: string;

  @ApiProperty({ description: 'Count of pending deposit requests' })
  pendingCount: number;

  @ApiProperty({
    type: DepositDistributionDto,
    description: 'Method distribution',
  })
  methodDistribution: DepositDistributionDto;
}
