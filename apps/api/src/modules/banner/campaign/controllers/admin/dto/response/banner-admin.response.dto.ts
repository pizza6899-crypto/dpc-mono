import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationAdminResponseDto {
  @ApiProperty({ enum: Language, enumName: 'Language', description: '언어 코드 (Enum: Language)' })
  language!: Language;

  @ApiProperty({ description: '언어별 활성화 여부', example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ description: '직접 이미지 URL', example: 'https://cdn.example.com/banner/ko.png' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: '제목', example: '스프링 캠페인' })
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트', example: '스프링 캠페인 배너' })
  altText?: string;
  @ApiPropertyOptional({ description: '언어별 링크', example: 'https://example.com/ko/promo' })
  linkUrl?: string;
}

export class BannerAdminResponseDto {
  @ApiProperty({ description: 'ID' })
  id!: string;

  @ApiPropertyOptional({ description: '관리자용 이름' })
  name?: string;

  @ApiProperty({ description: '활성 여부', example: true })
  isActive!: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order!: number;

  @ApiPropertyOptional({ description: '공통 링크 URL', example: 'https://example.com' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '노출 시작일', example: '2026-04-15T00:00:00Z' })
  startDate?: string;

  @ApiPropertyOptional({ description: '노출 종료일', example: '2026-05-15T23:59:59Z' })
  endDate?: string;

  @ApiPropertyOptional({ description: '삭제된 시간', example: null })
  deletedAt?: string;

  @ApiProperty({ type: [BannerTranslationAdminResponseDto], description: '언어별 응답 목록' })
  translations!: BannerTranslationAdminResponseDto[];
}
