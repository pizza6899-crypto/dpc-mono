import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EffectType, ExpiryType, ItemType, Language } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  Min
} from 'class-validator';
import { Prisma } from '@prisma/client';

export class SaveItemEffectAdminRequestDto {
  @ApiProperty({ enum: EffectType, description: 'Effect Type / 효과 타입' })
  @IsEnum(EffectType)
  type: EffectType;

  @ApiProperty({ description: 'Value / 수치', example: 10 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Target / 대상', example: 'STR' })
  @IsOptional()
  @IsString()
  target?: string;
}

export class SaveItemTranslationAdminRequestDto {
  @ApiProperty({ enum: Language, description: 'Language / 언어' })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({ description: 'Name / 이름', example: 'Power Sword' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description / 설명', example: 'Increases STR by 10' })
  @IsOptional()
  @IsString()
  description: string | null;
}

export class SaveItemCatalogAdminRequestDto {
  @ApiPropertyOptional({ description: 'ID / 아이템 ID (수정 시 필수)', example: '1' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Code / 고유 코드', example: 'SWORD_001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ItemType, description: 'Type / 아이템 타입' })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({ type: [SaveItemEffectAdminRequestDto], description: 'Effects / 효과 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveItemEffectAdminRequestDto)
  effects: SaveItemEffectAdminRequestDto[];

  @ApiProperty({ enum: ExpiryType, description: 'Expiry Type / 만료 정책', default: 'PERMANENT' })
  @IsEnum(ExpiryType)
  expiryType: ExpiryType;

  @ApiPropertyOptional({ description: 'Max Usage Count / 최대 사용 횟수 (횟수제일 경우 필수)', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsageCount?: number | null;

  @ApiProperty({ type: [SaveItemTranslationAdminRequestDto], description: 'Translations / 번역 목록' })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaveItemTranslationAdminRequestDto)
  translations: SaveItemTranslationAdminRequestDto[];
}
