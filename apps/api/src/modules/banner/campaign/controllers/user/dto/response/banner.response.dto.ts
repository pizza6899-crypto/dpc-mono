import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationResponseDto {
  @ApiProperty({ enum: Language })
  language: Language;

  @ApiProperty({ description: '언어별 활성화 여부' })
  isActive: boolean;

  @ApiPropertyOptional({ description: '직접 이미지 URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: '배너 제목' })
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트' })
  altText?: string;

  @ApiPropertyOptional({ description: '설명' })
  description?: string;

  @ApiPropertyOptional({ description: '링크 URL' })
  linkUrl?: string;
}

export class BannerResponseDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiPropertyOptional({ description: '관리자용 이름' })
  name?: string;

  @ApiProperty({ description: '활성 여부' })
  isActive: boolean;

  @ApiProperty({ description: '정렬 순서' })
  order: number;

  @ApiPropertyOptional({ description: '기본 링크 URL' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '다국어 번역 목록' })
  translations: BannerTranslationResponseDto[];
}
