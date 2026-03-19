import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNicknameRequestDto {
  @ApiProperty({
    description: 'New Nickname / 새로운 닉네임',
    example: 'LuckyPlayer',
  })
  @IsNotEmpty()
  @IsString()
  nickname: string;
}
