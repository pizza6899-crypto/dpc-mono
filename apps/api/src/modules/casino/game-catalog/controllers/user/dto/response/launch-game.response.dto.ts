import { ApiProperty } from '@nestjs/swagger';

export class LaunchGameResponseDto {
    @ApiProperty({ description: 'Game URL' })
    gameUrl: string;
}
