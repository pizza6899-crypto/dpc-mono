import { ApiProperty } from '@nestjs/swagger';

export class LaunchGameResponseDto {
    @ApiProperty({ description: 'Game URL / 게임 실행 URL' })
    gameUrl: string;

    @ApiProperty({ description: 'Session Identifier / 세션 식별자' })
    sessionId: string;
}
