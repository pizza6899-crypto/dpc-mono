import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerTranslationRequestDto {
  @ApiProperty({ enum: Language })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({ description: '번역 활성화 여부' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: '직접 이미지 URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: '설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '언어별 링크' })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}

export class CreateBannerAdminRequestDto {
  @ApiPropertyOptional({ description: '관리자용 이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '활성 여부' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: '정렬 순서' })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({ description: '공통 링크 URL' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: '노출 시작일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '노출 종료일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ type: [BannerTranslationRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerTranslationRequestDto)
  translations: BannerTranslationRequestDto[];
}
