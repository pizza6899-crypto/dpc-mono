// src/modules/casino-refactor/controllers/admin/dto/response/game-list.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { GameProvider, GameCategory, GameAggregatorType, Language } from '@repo/database';

export class GameTranslationDto {
  @ApiProperty({
    description: '번역 ID',
    example: '1234567890123456789',
    type: String,
  })
  id: string;

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

export class GameListItemDto {
  @ApiProperty({
    description: '게임 ID',
    example: '1234567890123456789',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '게임 UID',
    example: 'game-1234567890',
  })
  uid: string;

  @ApiProperty({
    description: '게임 애그리게이터 타입',
    enum: GameAggregatorType,
    example: GameAggregatorType.WHITECLIFF,
  })
  aggregatorType: GameAggregatorType;

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
    description: '애그리게이터 게임 ID',
    example: 12345,
  })
  aggregatorGameId: number;

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
    description: '활성화 여부',
    example: true,
  })
  isEnabled: boolean;

  @ApiProperty({
    description: '유저 노출 여부',
    example: true,
  })
  isVisibleToUser: boolean;

  @ApiProperty({
    description: '하우스 엣지',
    example: '0.04',
    type: String,
  })
  houseEdge: string;

  @ApiProperty({
    description: '기여율',
    example: '1.0',
    type: String,
  })
  contributionRate: string;

  @ApiProperty({
    description: '번역 정보',
    type: [GameTranslationDto],
    nullable: true,
  })
  translations?: GameTranslationDto[];

  @ApiProperty({
    description: '생성일',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;
}

