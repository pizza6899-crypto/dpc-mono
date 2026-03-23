import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EffectType, ExchangeCurrencyCode, ItemType, Language } from '@prisma/client';

export class ItemEffectAdminDto {
  @ApiProperty({ enum: EffectType, description: 'Effect Type / 효과 타입' })
  type: EffectType;

  @ApiProperty({ description: 'Value / 수치', example: 10 })
  value: number;

  @ApiPropertyOptional({ description: 'Target / 대상', example: 'STR' })
  target?: string;
}

export class ItemTranslationAdminDto {
  @ApiProperty({ enum: Language, description: 'Language / 언어' })
  language: Language;

  @ApiProperty({ description: 'Name / 이름', example: 'Power Sword' })
  name: string;

  @ApiPropertyOptional({ description: 'Description / 설명', example: 'Increases STR by 10' })
  description: string | null;
}

export class ItemCatalogAdminResponseDto {
  @ApiProperty({ description: 'ID / 아이템 ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Code / 고유 코드', example: 'SWORD_001' })
  code: string;

  @ApiProperty({ enum: ItemType, description: 'Type / 아이템 타' })
  type: ItemType;

  @ApiProperty({ type: [ItemEffectAdminDto], description: 'Effects / 효과 목록' })
  effects: ItemEffectAdminDto[];

  @ApiProperty({ description: 'Price / 가격', example: '100.00' })
  price: string;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency / 가격 통화' })
  priceCurrency: ExchangeCurrencyCode;

  @ApiPropertyOptional({ description: 'Duration Days / 유효 기간(일)', example: 30 })
  durationDays: number | null;

  @ApiProperty({ type: [ItemTranslationAdminDto], description: 'Translations / 번역 목록' })
  translations: ItemTranslationAdminDto[];

  @ApiProperty({ description: 'Updated At / 수정 일시' })
  updatedAt: Date;
}
