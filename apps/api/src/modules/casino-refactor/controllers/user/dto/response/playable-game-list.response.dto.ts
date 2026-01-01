// src/modules/casino-refactor/controllers/user/dto/response/playable-game-list.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { GameProvider, GameCategory, Language } from '@repo/database';

export class PlayableGameTranslationDto {
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
}

export class PlayableGameItemDto {
  @ApiProperty({
    description: '게임 UID',
    example: 'game-1234567890',
  })
  uid: string;

  @ApiProperty({
    description: '게임 프로바이더',
    enum: GameProvider,
    example: GameProvider.EVOLUTION,
  })
  provider: GameProvider;

  @ApiProperty({
    description: '게임 카테고리',
    enum: GameCategory,
    example: GameCategory.LIVE_CASINO,
  })
  category: GameCategory;

  @ApiProperty({
    description: '게임 타입',
    example: 'roulette',
    nullable: true,
  })
  gameType: string | null;

  @ApiProperty({
    description: '테이블 ID',
    example: 'table-001',
    nullable: true,
  })
  tableId: string | null;

  @ApiProperty({
    description: '아이콘 링크',
    example: 'https://example.com/icon.png',
    nullable: true,
  })
  iconLink: string | null;

  @ApiProperty({
    description: '번역 정보',
    type: [PlayableGameTranslationDto],
  })
  translations: PlayableGameTranslationDto[];
}

export class PlayableGameListResponseDto {
  @ApiProperty({
    description: '게임 목록',
    type: [PlayableGameItemDto],
  })
  data: PlayableGameItemDto[];

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 30,
  })
  limit: number;

  @ApiProperty({
    description: '전체 게임 수',
    example: 100,
  })
  total: number;
}

