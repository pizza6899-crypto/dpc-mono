import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class LaunchGameRequestDto {
  @ApiProperty({
    description: 'Encoded game ID (Sqids) / 인코딩된 게임 ID (Sqids)',
  })
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @ApiProperty({ description: 'Is mobile device / 모바일 기기 여부' })
  @IsBoolean()
  isMobile: boolean;
}
