import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GameResponseDto {
    @ApiProperty({ description: 'Game ID (Sqid)' })
    id: string;

    @ApiProperty()
    code: string;

    @ApiProperty({ description: 'Game name (localized)' })
    name: string;

    @ApiPropertyOptional()
    thumbnailUrl?: string;

    @ApiPropertyOptional()
    bannerUrl?: string;

    @ApiPropertyOptional()
    rtp?: string;

    @ApiPropertyOptional()
    volatility?: string;

    @ApiPropertyOptional()
    gameType?: string;
}
