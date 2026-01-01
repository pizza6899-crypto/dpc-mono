// src/modules/casino-refactor/controllers/admin/dto/request/sync-games-from-aggregator.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  GameAggregatorType,
  GameProvider,
  Language,
} from '@repo/database';

export class SyncGamesFromAggregatorDto {
  @ApiProperty({
    description: '게임 애그리게이터 타입',
    enum: GameAggregatorType,
    example: GameAggregatorType.WHITECLIFF,
  })
  @IsEnum(GameAggregatorType)
  aggregatorType: GameAggregatorType;

  @ApiPropertyOptional({
    description: '게임 프로바이더 (선택사항)',
    enum: GameProvider,
    example: GameProvider.EVOLUTION,
  })
  @IsOptional()
  @IsEnum(GameProvider)
  provider?: GameProvider;

  @ApiPropertyOptional({
    description: '언어 (선택사항)',
    enum: Language,
    example: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}

