// src/modules/promotion/controllers/admin/dto/response/promotion-translation.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromotionTranslationResponseDto {
  @ApiProperty({
    description: '번역 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '프로모션 ID',
    example: 1,
  })
  promotionId: number;

  @ApiProperty({
    description: '언어 코드',
    example: 'KO',
  })
  language: string;

  @ApiProperty({
    description: '프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  name: string;

  @ApiPropertyOptional({
    description: '프로모션 설명',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    nullable: true,
  })
  description?: string | null;

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

export class PromotionTranslationListResponseDto {
  @ApiProperty({
    description: '번역 정보 목록',
    type: [PromotionTranslationResponseDto],
  })
  translations: PromotionTranslationResponseDto[];
}

