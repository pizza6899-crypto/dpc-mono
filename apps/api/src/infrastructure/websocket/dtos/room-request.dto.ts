import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RoomRequestDto {
    @ApiProperty({
        description: '입장하거나 퇴장할 소켓 룸의 이름',
        example: 'chat:support:123',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    room: string;
}
