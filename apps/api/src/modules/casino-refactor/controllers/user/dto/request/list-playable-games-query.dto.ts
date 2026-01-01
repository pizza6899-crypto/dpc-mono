// src/modules/casino-refactor/controllers/user/dto/request/list-playable-games-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { Language, GameProvider, GameCategory } from '@repo/database';

type GameSortFields = 'createdAt' | 'updatedAt';

export class ListPlayableGamesQueryDto extends createPaginationQueryDto<GameSortFields>(
  {
    defaultLimit: 30,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt'],
) {
  @ApiPropertyOptional({
    description: '언어 (번역 정보 포함 시 사용)',
    enum: Language,
    example: Language.EN,
    default: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language = Language.EN;

  @ApiPropertyOptional({
    description: '게임 프로바이더 필터',
    enum: GameProvider,
    example: GameProvider.EVOLUTION,
  })
  @IsOptional()
  @IsEnum(GameProvider)
  provider?: GameProvider;

  @ApiPropertyOptional({
    description: '게임 카테고리 필터',
    enum: GameCategory,
    example: GameCategory.LIVE_CASINO,
  })
  @IsOptional()
  @IsEnum(GameCategory)
  category?: GameCategory;
}

