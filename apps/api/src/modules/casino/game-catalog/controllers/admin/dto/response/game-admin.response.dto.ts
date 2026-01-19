import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@repo/database';

export class GameTranslationAdminResponseDto {
    @ApiProperty({ enum: Language })
    language: Language;

    @ApiProperty()
    name: string;
}

export class GameAdminResponseDto {
    @ApiProperty()
    id: string; // Sqid

    @ApiProperty()
    providerId: string; // Sqid

    @ApiProperty()
    externalGameId: string;

    @ApiProperty()
    code: string;

    @ApiProperty({ required: false })
    thumbnailUrl?: string;

    @ApiProperty({ required: false })
    bannerUrl?: string;

    @ApiProperty({ required: false })
    rtp?: string;

    @ApiProperty({ required: false })
    volatility?: string;

    @ApiProperty({ required: false })
    gameType?: string;

    @ApiProperty({ required: false })
    tableId?: string;

    @ApiProperty({ type: [String] })
    tags: string[];

    @ApiProperty()
    houseEdge: string;

    @ApiProperty()
    contributionRate: string;

    @ApiProperty()
    sortOrder: number;

    @ApiProperty()
    isEnabled: boolean;

    @ApiProperty()
    isVisible: boolean;

    @ApiProperty({ type: [GameTranslationAdminResponseDto] })
    translations: GameTranslationAdminResponseDto[];
}
