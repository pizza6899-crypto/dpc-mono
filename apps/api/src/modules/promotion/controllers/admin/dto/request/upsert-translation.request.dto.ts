// src/modules/promotion/controllers/admin/dto/request/upsert-translation.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Language } from '@prisma/client';

export class UpsertTranslationRequestDto {
  @ApiProperty({
    description: '언어 코드',
    example: Language.KO,
    enum: Language,
  })
  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;

  @ApiProperty({
    description: '프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '프로모션 설명',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}

