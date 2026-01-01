// src/modules/casino-refactor/controllers/admin/dto/response/update-game.response.dto
import { ApiProperty } from '@nestjs/swagger';
import { GameProvider, GameCategory, GameAggregatorType } from '@repo/database';

export class UpdateGameResponseDto {
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
    description: '게임 활성화 여부',
    example: true,
  })
  isEnabled: boolean;

  @ApiProperty({
    description: '유저에게 게임 표시 여부',
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

