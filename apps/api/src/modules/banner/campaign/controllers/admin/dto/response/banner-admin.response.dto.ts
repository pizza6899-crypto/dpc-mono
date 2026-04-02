import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationAdminResponseDto {
  @ApiProperty({ enum: Language, enumName: 'Language', description: '언어 코드 (Enum: Language) / Language code (Enum: Language)' })
  language!: Language;

  @ApiProperty({ description: '언어별 활성화 여부 / Language-specific active flag', example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ description: '이미지 URL (fileId에서 해석됨) / Image URL (resolved from fileId)', example: 'https://cdn.example.com/banner/ko.png' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: '제목 / Title', example: '스프링 캠페인' })
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트 / ALT text', example: '스프링 캠페인 배너' })
  altText?: string;
  
  @ApiPropertyOptional({ description: '언어별 링크 / Language-specific link', example: 'https://example.com/ko/promo' })
  linkUrl?: string;
}

export class BannerAdminResponseDto {
  @ApiProperty({ description: 'ID' })
  id!: string;

  @ApiPropertyOptional({ description: '관리자용 이름 / Admin name' })
  name?: string;

  @ApiProperty({ description: '활성 여부 / Active flag', example: true })
  isActive!: boolean;

  @ApiProperty({ description: '정렬 순서 / Order', example: 1 })
  order!: number;

  @ApiPropertyOptional({ description: '공통 링크 URL / Common link URL', example: 'https://example.com' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '노출 시작일 / Display start date', example: '2026-04-15T00:00:00Z' })
  startDate?: string;

  @ApiPropertyOptional({ description: '노출 종료일 / Display end date', example: '2026-05-15T23:59:59Z' })
  endDate?: string;

  @ApiPropertyOptional({ description: '삭제된 시간 / Deleted at', example: null })
  deletedAt?: string;

  @ApiProperty({ type: [BannerTranslationAdminResponseDto], description: '언어별 응답 목록 / Translations response list' })
  translations!: BannerTranslationAdminResponseDto[];
}
