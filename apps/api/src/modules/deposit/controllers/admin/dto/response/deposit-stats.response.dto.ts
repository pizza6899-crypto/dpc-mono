// src/modules/deposit/dtos/deposit-stats.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DepositDistributionDto {
  @ApiProperty({
    description: '암호화폐 입금 비중 또는 개수 / Crypto deposit count or ratio',
  })
  crypto: number;

  @ApiProperty({
    description:
      '무통장(피아트) 입금 비중 또는 개수 / Bank(Fiat) transfer deposit count or ratio',
  })
  bank: number;
}

export class DepositStatsResponseDto {
  @ApiProperty({ description: '금일 총 입금액 / Total deposit amount today' })
  todayTotalAmount: string;

  @ApiProperty({
    description: '대기 중인 입금 요청 수 / Count of pending deposit requests',
  })
  pendingCount: number;

  @ApiProperty({
    type: DepositDistributionDto,
    description: '입금 수단별 분포 / Method distribution',
  })
  methodDistribution: DepositDistributionDto;
}
