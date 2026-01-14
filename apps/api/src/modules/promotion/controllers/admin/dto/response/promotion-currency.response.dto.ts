// src/modules/promotion/controllers/admin/dto/response/promotion-currency.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';

export class PromotionCurrencyResponseDto {
  @ApiProperty({
    description: '통화별 설정 ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '프로모션 ID',
    example: '1',
    type: String,
  })
  promotionId: string;

  @ApiProperty({
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '최소 입금 금액',
    example: '10.00',
    type: String,
  })
  minDepositAmount: string;

  @ApiPropertyOptional({
    description: '최대 보너스 금액',
    example: '1000.00',
    type: String,
  })
  maxBonusAmount?: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

export class PromotionCurrencyListResponseDto {
  @ApiProperty({
    description: '통화별 설정 목록',
    type: [PromotionCurrencyResponseDto],
  })
  currencies: PromotionCurrencyResponseDto[];
}
