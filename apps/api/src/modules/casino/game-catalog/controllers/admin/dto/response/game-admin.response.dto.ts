import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class GameTranslationAdminResponseDto {
    @ApiProperty({ enum: Language, description: '언어 코드 / Language code' })
    language: Language;

    @ApiProperty({ description: '게임 이름 / Game name' })
    name: string;
}

export class GameAdminResponseDto {
    @ApiProperty({ description: '게임 ID (숫자) / Game ID (numeric)' })
    id: string;

    @ApiProperty({ description: '프로바이더 ID (숫자) / Provider ID (numeric)' })
    providerId: string;

    @ApiProperty({ description: '외부 게임 ID / External game ID' })
    externalGameId: string;

    @ApiProperty({ description: '게임 코드 / Game code' })
    code: string;

    @ApiPropertyOptional({ description: '썸네일 URL / Thumbnail URL' })
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: '배너 URL / Banner URL' })
    bannerUrl?: string;

    @ApiPropertyOptional({ description: 'RTP (Return To Player) 백분율 / RTP percentage' })
    rtp?: string;

    @ApiPropertyOptional({ description: '변동성 (LOW, MEDIUM, HIGH, VERY_HIGH) / Volatility' })
    volatility?: string;

    @ApiPropertyOptional({ description: '게임 타입 / Game type' })
    gameType?: string;

    @ApiPropertyOptional({ description: '테이블 ID (라이브 게임용) / Table ID (for live games)' })
    tableId?: string;

    @ApiProperty({ type: [String], description: '태그 목록 / Tags' })
    tags: string[];

    @ApiProperty({ description: '하우스 엣지 / House edge' })
    houseEdge: string;

    @ApiProperty({ description: '롤링 기여율 / Contribution rate' })
    contributionRate: string;

    @ApiProperty({ description: '정렬 순서 / Sort order' })
    sortOrder: number;

    @ApiProperty({ description: '활성화 여부 / Enabled status' })
    isEnabled: boolean;

    @ApiProperty({ description: '사용자 노출 여부 / Visibility to users' })
    isVisible: boolean;

    @ApiProperty({ type: [GameTranslationAdminResponseDto], description: '번역 정보 / Translations' })
    translations: GameTranslationAdminResponseDto[];
}

