// src/modules/promotion/controllers/user/dto/request/list-active-promotions-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { Language, ExchangeCurrencyCode } from '@prisma/client';

type PromotionSortFields = 'createdAt' | 'updatedAt' | 'id';

export class ListActivePromotionsQueryDto extends createPaginationQueryDto<PromotionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'id'],
) {
  @ApiPropertyOptional({
    description: '언어 코드 (번역 정보 포함, 기본값: EN)',
    enum: Language,
    example: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: '통화 코드 (특정 통화의 프로모션만 조회)',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USDT,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  currency?: ExchangeCurrencyCode;
}

