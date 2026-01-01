// src/modules/casino-refactor/controllers/admin/dto/response/sync-games-from-aggregator.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SyncGamesFromAggregatorResponseDto {
  @ApiProperty({
    description: '전체 처리된 게임 수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '생성된 게임 수',
    example: 10,
  })
  created: number;

  @ApiProperty({
    description: '업데이트된 게임 수',
    example: 80,
  })
  updated: number;

  @ApiProperty({
    description: '비활성화된 게임 수',
    example: 5,
  })
  disabled: number;

  @ApiProperty({
    description: '오류 메시지 목록',
    type: [String],
    example: [],
  })
  errors: string[];
}

