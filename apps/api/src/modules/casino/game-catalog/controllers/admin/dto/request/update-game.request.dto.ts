import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GameTranslationUpdateDto {
    @ApiPropertyOptional({ enum: Language, description: '언어 코드 / Language code' })
    @IsEnum(Language)
    language: Language;

    @ApiPropertyOptional({ description: '게임 이름 / Game name' })
    @IsString()
    name: string;
}

/**
 * 게임 수정 DTO (관리자용)
 * 게임 생성은 외부 API 연동을 통해서만 가능하며, 관리자는 수정만 가능합니다.
 */
export class UpdateGameAdminRequestDto {
    @ApiPropertyOptional({ description: '썸네일 URL / Thumbnail URL' })
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: '배너 URL / Banner URL' })
    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @ApiPropertyOptional({ description: 'RTP (Return To Player) 백분율 / RTP percentage' })
    @IsOptional()
    @IsNumber()
    rtp?: number;

    @ApiPropertyOptional({ description: '변동성 (LOW, MEDIUM, HIGH, VERY_HIGH) / Volatility' })
    @IsOptional()
    @IsString()
    volatility?: string;

    @ApiPropertyOptional({ description: '게임 타입 / Game type' })
    @IsOptional()
    @IsString()
    gameType?: string;

    @ApiPropertyOptional({ description: '테이블 ID (라이브 게임용) / Table ID (for live games)' })
    @IsOptional()
    @IsString()
    tableId?: string;

    @ApiPropertyOptional({ type: [String], description: '태그 목록 / Tags' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({ description: '하우스 엣지 / House edge' })
    @IsOptional()
    @IsNumber()
    houseEdge?: number;

    @ApiPropertyOptional({ description: '롤링 기여율 / Contribution rate' })
    @IsOptional()
    @IsNumber()
    contributionRate?: number;

    @ApiPropertyOptional({ description: '정렬 순서 / Sort order' })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ description: '활성화 여부 / Enabled status' })
    @IsOptional()
    @IsBoolean()
    isEnabled?: boolean;

    @ApiPropertyOptional({ description: '사용자 노출 여부 / Visibility to users' })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiPropertyOptional({ type: [GameTranslationUpdateDto], description: '번역 정보 / Translations' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GameTranslationUpdateDto)
    translations?: GameTranslationUpdateDto[];
}
