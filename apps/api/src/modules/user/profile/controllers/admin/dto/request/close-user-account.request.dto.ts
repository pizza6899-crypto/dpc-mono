import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CloseUserAccountRequestDto {
  @ApiProperty({
    description: 'Reason for closing the account / 계정 종료 사유',
    example: '사용자 요청에 의한 영구 탈퇴 처리',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
