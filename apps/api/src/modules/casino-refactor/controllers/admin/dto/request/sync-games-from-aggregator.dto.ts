// src/modules/casino-refactor/controllers/admin/dto/request/sync-games-from-aggregator.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { GameProvider } from '@repo/database';

export class SyncGamesFromAggregatorDto {
  @ApiPropertyOptional({
    description: '게임 프로바이더 (없으면 전체 프로바이더 동기화)',
    enum: GameProvider,
    example: GameProvider.PLAYNGO,
  })
  @IsOptional()
  @IsEnum(GameProvider)
  provider?: GameProvider;
}

