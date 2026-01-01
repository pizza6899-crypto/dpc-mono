// src/modules/casino-refactor/controllers/admin/dto/response/update-game-translation.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@repo/database';

export class UpdateGameTranslationResponseDto {
  @ApiProperty({
    description: '번역 ID',
    example: '1234567890123456789',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '번역 UID',
    example: 'translation-1234567890',
  })
  uid: string;

  @ApiProperty({
    description: '게임 ID',
    example: '1234567890123456789',
    type: String,
  })
  gameId: string;

  @ApiProperty({
    description: '언어',
    enum: Language,
    example: Language.EN,
  })
  language: Language;

  @ApiProperty({
    description: '프로바이더명',
    example: 'Evolution Gaming',
  })
  providerName: string;

  @ApiProperty({
    description: '카테고리명',
    example: 'Live Casino',
  })
  categoryName: string;

  @ApiProperty({
    description: '게임명',
    example: 'Lightning Roulette',
  })
  gameName: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

