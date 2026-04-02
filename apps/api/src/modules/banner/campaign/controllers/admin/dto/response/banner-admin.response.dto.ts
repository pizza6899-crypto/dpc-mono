import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationAdminResponseDto {
  @ApiProperty({ enum: Language })
  language!: Language;

  @ApiProperty({ description: '언어별 활성화 여부' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: '직접 이미지 URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: '제목' })
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트' })
  altText?: string;
  @ApiPropertyOptional({ description: '언어별 링크' })
  linkUrl?: string;
}

export class BannerAdminResponseDto {
  @ApiProperty({ description: 'ID' })
  id!: string;

  @ApiPropertyOptional({ description: '관리자용 이름' })
  name?: string;

  @ApiProperty({ description: '활성 여부' })
  isActive!: boolean;

  @ApiProperty({ description: '정렬 순서' })
  order!: number;

  @ApiPropertyOptional({ description: '공통 링크 URL' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '노출 시작일' })
  startDate?: string;

  @ApiPropertyOptional({ description: '노출 종료일' })
  endDate?: string;

  @ApiPropertyOptional({ description: '삭제된 시간' })
  deletedAt?: string;

  @ApiProperty({ type: [BannerTranslationAdminResponseDto] })
  translations!: BannerTranslationAdminResponseDto[];
}
