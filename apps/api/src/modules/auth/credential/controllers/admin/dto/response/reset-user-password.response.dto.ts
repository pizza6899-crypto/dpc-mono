import { ApiProperty } from '@nestjs/swagger';

export class ResetUserPasswordResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '메시지', example: '비밀번호가 초기화되었습니다.' })
  message: string;
}

