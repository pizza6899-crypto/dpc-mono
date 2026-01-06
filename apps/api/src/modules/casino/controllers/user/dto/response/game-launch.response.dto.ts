import { ApiProperty } from '@nestjs/swagger';

export class GameLaunchResponseDto {
    @ApiProperty({
        description: 'Game Launch URL (게임 실행 URL)',
        example: 'https://game.domain.com/launch?token=xyz987&session=abc123',
    })
    gameUrl: string;
}
