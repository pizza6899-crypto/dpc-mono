import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogGameResponseDto {
    @ApiProperty({ description: 'Game ID (Sqid) (게임 아이디)' })
    id: string;

    @ApiProperty({ description: 'Game Code (게임 코드)' })
    code: string;

    @ApiProperty({ description: 'Game name (localized) (게임 이름)' })
    name: string;

    @ApiPropertyOptional({ description: 'Thumbnail URL (썸네일 URL)' })
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: 'Banner URL (배너 URL)' })
    bannerUrl?: string;

    @ApiPropertyOptional({ description: 'RTP (환수율)' })
    rtp?: string;

    @ApiPropertyOptional({ description: 'Volatility (변동성)' })
    volatility?: string;

    @ApiPropertyOptional({ description: 'Game Type (게임 타입)' })
    gameType?: string;
}
