// src/modules/casino-refactor/controllers/admin/dto/request/update-game.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGameDto {
  @ApiPropertyOptional({
    description: '게임 타입',
    example: 'roulette',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gameType?: string | null;

  @ApiPropertyOptional({
    description: '테이블 ID',
    example: 'table-001',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  tableId?: string | null;

  @ApiPropertyOptional({
    description: '아이콘 링크',
    example: 'https://example.com/icon.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  iconLink?: string | null;

  @ApiPropertyOptional({
    description: '게임 활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: '유저에게 게임 표시 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVisibleToUser?: boolean;

  @ApiPropertyOptional({
    description: '하우스 엣지 (0 이상 1 미만)',
    example: 0.04,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.999999)
  @Type(() => Number)
  houseEdge?: number;

  @ApiPropertyOptional({
    description: '기여율 (0 이상)',
    example: 1.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  contributionRate?: number;
}

