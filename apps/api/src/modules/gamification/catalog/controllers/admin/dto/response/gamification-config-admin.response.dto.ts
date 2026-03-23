import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

/**
 * 게이미피케이션 전역 정책 설정 응답 DTO
 * (Presentation 레이어의 순수성을 보장하며 도메인 엔티티를 직접 참조하지 않습니다)
 */
export class GamificationConfigAdminResponseDto {
  @ApiProperty({ description: 'Singleton identifier (always 1) / 유일 식별값 (항상 1)', example: 1 })
  id: number;

  @ApiProperty({ description: 'XP multiplier per USD rolling / 1 USD 베팅당 획득 경험치 배율', example: '1.25' })
  expGrantMultiplierUsd: string;

  @ApiProperty({ description: 'Stat points granted per level up / 레벨업당 지급 스탯 포인트', example: 1 })
  statPointGrantPerLevel: number;

  @ApiProperty({ description: 'Maximum cap for a single stat / 단일 스탯 최대 한도', example: 999 })
  maxStatLimit: number;

  @ApiProperty({ description: 'Stat reset price / 스탯 초기화 비용', example: '10000' })
  statResetPrice: string;

  @ApiProperty({ description: 'Currency for stat reset / 스탯 초기화 통화 코드', enum: ExchangeCurrencyCode, example: 'KRW' })
  statResetCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Last optimization timestamp / 최종 수정 시각' })
  updatedAt: Date;
}
