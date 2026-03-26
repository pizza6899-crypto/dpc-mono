import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

/**
 * [Artifact Public] 유물 정책 정보 응답 DTO
 */
export class ArtifactPolicyPublicResponseDto {
  @ApiProperty({
    description: 'Draw Prices (Single/Ten) by Currency / 통화별 뽑기 가격 (1회/10회)',
    example: {
      SINGLE: {
        KRW: 10000,
        USD: 10,
        USDT: 10,
        JPY: 1500,
      },
      TEN: {
        KRW: 90000,
        USD: 90,
        USDT: 90,
        JPY: 13500,
      },
    },
  })
  drawPrices: Record<string, Partial<Record<ExchangeCurrencyCode, number>>>;

  @ApiProperty({
    description: 'Synthesis Rules by Grade / 등급별 합성 규칙',
    example: {
      COMMON: { requiredCount: 3, successRate: 0.2 },
      RARE: { requiredCount: 3, successRate: 0.125, guaranteedCount: 20 },
      MYTHIC: { requiredCount: 3, successRate: 1.0 },
    },
  })
  synthesisConfigs: Record<string, any>;

  @ApiProperty({
    description: 'Slot Unlock Requirements by Level / 레벨별 슬롯 해금 요건',
    example: {
      unlockLevels: [1, 1, 50, 100],
    },
  })
  slotUnlockConfigs: {
    unlockLevels: number[];
  };
}
