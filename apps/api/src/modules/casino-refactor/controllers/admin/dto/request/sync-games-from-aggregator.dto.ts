// src/modules/casino-refactor/controllers/admin/dto/request/sync-games-from-aggregator.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GameProvider } from '@repo/database';

export class SyncGamesFromAggregatorDto {
  @ApiProperty({
    description: '게임 프로바이더',
    enum: GameProvider,
    example: GameProvider.PLAYNGO,
  })
  @IsEnum(GameProvider)
  provider: GameProvider;
}

