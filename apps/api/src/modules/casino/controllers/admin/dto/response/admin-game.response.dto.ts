import { ApiProperty } from '@nestjs/swagger';
import { GameCategory, GameProvider, GameAggregatorType } from 'src/generated/prisma';

export class AdminGameResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: GameCategory })
    category: GameCategory;

    @ApiProperty({ enum: GameProvider })
    provider: GameProvider;

    @ApiProperty({ enum: GameAggregatorType })
    aggregatorType: GameAggregatorType;

    @ApiProperty()
    imageUrl: string;

    @ApiProperty()
    isEnabled: boolean;

    @ApiProperty()
    isVisibleToUser: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
