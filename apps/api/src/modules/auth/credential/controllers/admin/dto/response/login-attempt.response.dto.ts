import { ApiProperty } from '@nestjs/swagger';

export class LoginAttemptResponseDto {
  @ApiProperty({ description: '내부 ID', type: 'string' })
  id: string;

  @ApiProperty({ description: '비즈니스 UID' })
  uid: string;

  @ApiProperty({ description: '사용자 ID', nullable: true })
  userId: string | null;

  @ApiProperty({ description: '결과 (SUCCESS/FAILED)' })
  result: string;

  @ApiProperty({ description: '실패 이유', nullable: true })
  failureReason: string | null;

  @ApiProperty({ description: 'IP 주소', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: '이메일', nullable: true })
  email: string | null;

  @ApiProperty({ description: '시도 시간' })
  attemptedAt: Date;

  @ApiProperty({ description: '관리자 시도 여부' })
  isAdmin: boolean;
}
