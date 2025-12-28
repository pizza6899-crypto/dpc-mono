import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { createPaginationQueryDto } from 'src/platform/http/types';
import { GameCategory, GameProvider, Language } from '@repo/database';

type GameSortFields = 'createdAt' | 'gameName' | 'categoryName';

export class GameListRequestDto extends createPaginationQueryDto<GameSortFields>(
  {
    defaultLimit: 30,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'gameName', 'categoryName'],
) {
  @ApiPropertyOptional({
    description: 'Language (언어) - 게임 번역 언어 선택',
    enum: Language,
    default: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language = Language.EN;

  @ApiPropertyOptional({
    description: 'Provider IDs (프로바이더 ID 목록) - 여러 개 선택 가능',
    enum: GameProvider,
    type: [String],
    isArray: true,
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value;
    }
    // 단일 값도 배열로 변환 (하위 호환성)
    return [value];
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one provider must be selected' })
  @IsEnum(GameProvider, { each: true })
  providerId?: GameProvider[];

  @ApiPropertyOptional({
    description: 'Game Categories (게임 카테고리 목록) - 여러 개 선택 가능',
    enum: GameCategory,
    type: [String],
    isArray: true,
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value;
    }
    // 단일 값도 배열로 변환 (하위 호환성)
    return [value];
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category must be selected' })
  @IsEnum(GameCategory, { each: true })
  category?: GameCategory[];

  @ApiPropertyOptional({
    description: 'Search keyword (검색 키워드) - 게임명 검색',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  keyword?: string;
}

export class GameInfoDto {
  @ApiProperty({
    description: 'Game ID (게임 ID)',
    example: 1001,
    type: Number,
  })
  gameId: number;

  @ApiProperty({
    description: 'Game Name (게임명)',
    example: 'Fortune Tiger',
  })
  gameName: string;

  @ApiProperty({
    description: 'Category Name (카테고리명)',
    example: '슬롯',
  })
  category: GameCategory;

  @ApiProperty({
    description: 'Provider Name (프로바이더명)',
    example: 'PG Soft',
  })
  provider: GameProvider;

  @ApiProperty({
    description: 'Game Image URL (게임 이미지 URL)',
    example: 'https://example.com/games/fortune-tiger.jpg',
  })
  imageUrl: string;
}
