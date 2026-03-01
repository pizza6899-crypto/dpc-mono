import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateNicknameRequestDto {
    @ApiProperty({ description: 'New Nickname / 새로운 닉네임', example: 'LuckyPlayer' })
    @IsNotEmpty()
    @IsString()
    @Length(2, 50)
    nickname: string;
}
