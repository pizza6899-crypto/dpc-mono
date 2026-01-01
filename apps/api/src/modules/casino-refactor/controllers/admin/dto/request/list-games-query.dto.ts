// src/modules/casino-refactor/controllers/admin/dto/request/list-games-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { Language, GameProvider, GameCategory, GameAggregatorType } from '@repo/database';

type GameSortFields = 'createdAt' | 'updatedAt';

export class ListGamesQueryDto extends createPaginationQueryDto<GameSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt'],
) {
  @ApiPropertyOptional({
    description: '번역 정보 포함 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTranslations?: boolean = false;

  @ApiPropertyOptional({
    description: '언어 (번역 정보 포함 시 사용)',
    enum: Language,
    example: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: '활성화 여부 필터',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: '유저 노출 여부 필터',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVisibleToUser?: boolean;

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

  @ApiPropertyOptional({
    description: '게임 애그리게이터 타입 필터',
    enum: GameAggregatorType,
    example: GameAggregatorType.WHITECLIFF,
  })
  @IsOptional()
  @IsEnum(GameAggregatorType)
  aggregatorType?: GameAggregatorType;
}

