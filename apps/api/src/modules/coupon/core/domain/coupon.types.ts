import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export type TranslationRecord = Partial<Record<Language, string>>;

/**
 * 쿠폰 메타데이터 구조 (i18n 지원)
 */
export class CouponMetadata {
  @ApiProperty({
    description: 'Coupon Title (i18n) / 쿠폰 이름 (다국어)',
    example: { EN: 'Welcome Bonus', KO: '가입 환영 쿠폰' },
  })
  @IsObject()
  @IsOptional()
  title: TranslationRecord;

  @ApiProperty({
    description: 'Coupon Description (i18n) / 쿠폰 설명 (다국어)',
    example: { EN: 'Reward for new users', KO: '신규 유저를 위한 보너스 쿠폰입니다.' },
  })
  @IsObject()
  @IsOptional()
  description: TranslationRecord;
}
