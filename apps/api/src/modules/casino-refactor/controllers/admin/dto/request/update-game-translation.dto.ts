// src/modules/casino-refactor/controllers/admin/dto/request/update-game-translation.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Language } from '@repo/database';

export class UpdateGameTranslationDto {
  @ApiProperty({
    description: '언어',
    enum: Language,
    example: Language.EN,
  })
  @IsEnum(Language)
  language: Language;

  @ApiPropertyOptional({
    description: '프로바이더명',
    example: 'Evolution Gaming',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  providerName?: string;

  @ApiPropertyOptional({
    description: '카테고리명',
    example: 'Live Casino',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryName?: string;

  @ApiPropertyOptional({
    description: '게임명',
    example: 'Lightning Roulette',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  gameName?: string;
}

