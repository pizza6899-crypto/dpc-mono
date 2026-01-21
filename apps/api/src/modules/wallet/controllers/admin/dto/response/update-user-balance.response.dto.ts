// src/modules/wallet/controllers/admin/dto/response/update-user-balance.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class UpdateUserBalanceResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: '통화 코드',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USDT,
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '업데이트 전 메인 잔액',
    example: '1000.00',
    type: String,
  })
  beforeMainBalance: string;

  @ApiProperty({
    description: '업데이트 후 메인 잔액',
    example: '1100.00',
    type: String,
  })
  afterMainBalance: string;

  @ApiProperty({
    description: '업데이트 전 보너스 잔액',
    example: '500.00',
    type: String,
  })
  beforeBonusBalance: string;

  @ApiProperty({
    description: '업데이트 후 보너스 잔액',
    example: '500.00',
    type: String,
  })
  afterBonusBalance: string;

  @ApiProperty({
    description: '메인 잔액 변경량 (after - before)',
    example: '100.00',
    type: String,
  })
  mainBalanceChange: string;

  @ApiProperty({
    description: '보너스 잔액 변경량 (after - before)',
    example: '0.00',
    type: String,
  })
  bonusBalanceChange: string;

  @ApiProperty({
    description: '업데이트 후 총 잔액 (메인 + 보너스)',
    example: '1600.00',
    type: String,
  })
  totalBalance: string;

  @ApiProperty({
    description: '마지막 업데이트 시간',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

