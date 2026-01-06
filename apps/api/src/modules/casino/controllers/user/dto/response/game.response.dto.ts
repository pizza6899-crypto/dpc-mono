import { ApiProperty } from '@nestjs/swagger';
import { GameCategory, GameProvider } from '@repo/database';

export class GameResponseDto {
    @ApiProperty({
        description: 'Game ID (게임 ID)',
        example: 1001,
        type: BigInt,
    })
    gameId: bigint;

    @ApiProperty({
        description: 'Game Name (게임명)',
        example: 'Fortune Tiger',
    })
    gameName: string;

    @ApiProperty({
        description: 'Category Name (카테고리명)',
        example: '슬롯',
        enum: GameCategory,
    })
    category: GameCategory;

    @ApiProperty({
        description: 'Provider Name (프로바이더명)',
        example: 'PG Soft',
        enum: GameProvider,
    })
    provider: GameProvider;

    @ApiProperty({
        description: 'Game Image URL (게임 이미지 URL)',
        example: 'https://example.com/games/fortune-tiger.jpg',
    })
    imageUrl: string;
}
