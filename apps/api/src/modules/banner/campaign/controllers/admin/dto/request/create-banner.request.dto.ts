import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationRequestDto {
  @ApiProperty({ enum: Language, enumName: 'Language', description: '언어 코드 (Enum: Language) / Language code (Enum: Language)' })
  @IsEnum(Language)
  language!: Language;

  @ApiProperty({ description: '번역 활성화 여부 / Translation active flag', example: true })
  @IsBoolean()
  isActive!: boolean;
  
  @ApiPropertyOptional({ description: '직접 이미지 URL / Direct image URL', example: 'https://cdn.example.com/banner/en.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @ApiPropertyOptional({ description: '제목 / Title', example: 'Spring Campaign' })
  @IsOptional()
  @IsString()
  title?: string;
  @ApiPropertyOptional({ description: 'ALT 텍스트 / ALT text', example: 'Spring Campaign Banner' })
  @IsOptional()
  @IsString()
  altText?: string;
  @ApiPropertyOptional({ description: '언어별 링크 / Language-specific link', example: 'https://example.com/promo' })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}

export class CreateBannerAdminRequestDto {
  @ApiPropertyOptional({ description: '관리자용 이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '활성 여부 / Active flag', example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ description: '정렬 순서 / Order', example: 1 })
  @IsNumber()
  order!: number;

  @ApiPropertyOptional({ description: '공통 링크 URL / Common link URL', example: 'https://example.com' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: '노출 시작일 (ISO 8601) / Display start date (ISO 8601)', example: '2026-04-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '노출 종료일 (ISO 8601) / Display end date (ISO 8601)', example: '2026-05-15T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '삭제된 시간 (ISO 8601) / Deleted at (ISO 8601)', example: null })
  @IsOptional()
  @IsDateString()
  deletedAt?: string;

  @ApiProperty({ type: [BannerTranslationRequestDto], description: '언어별 전환 정보 / Language-specific translation entries', example: [{ language: 'EN', isActive: true, title: 'Spring Campaign', imageUrl: 'https://cdn.example.com/banner/en.png' }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerTranslationRequestDto)
  translations!: BannerTranslationRequestDto[];
}
