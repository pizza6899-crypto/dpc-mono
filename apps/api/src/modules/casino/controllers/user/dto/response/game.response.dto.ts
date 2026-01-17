import { ApiProperty } from '@nestjs/swagger';
import { GameCategory, GameProvider } from 'src/generated/prisma';

export class GameResponseDto {
    @ApiProperty({
        description: 'ID (Sqid)',
        example: 'cg_abcdef123',
    })
    id: string;

    @ApiProperty({
        description: 'Game Name (게임명)',
        example: 'Fortune Tiger',
    })
    name: string;

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
