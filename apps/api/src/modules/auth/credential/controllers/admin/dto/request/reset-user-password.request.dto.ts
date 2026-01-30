import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetUserPasswordRequestDto {
  @ApiProperty({ description: '새 비밀번호 (선택사항, 미제공 시 자동 생성)', example: 'newPassword123!', required: false })
  @IsString()
  @MinLength(8)
  newPassword?: string;
}

