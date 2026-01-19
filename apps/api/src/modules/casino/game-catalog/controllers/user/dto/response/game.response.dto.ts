import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@repo/database';

export class GameTranslationResponseDto {
    @ApiProperty({ enum: Language })
    language: Language;

    @ApiProperty()
    name: string;
}

export class GameResponseDto {
    @ApiProperty({ description: 'Game ID (Sqid)' })
    id: string;

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

    @ApiProperty({ type: [GameTranslationResponseDto] })
    translations: GameTranslationResponseDto[];
}
