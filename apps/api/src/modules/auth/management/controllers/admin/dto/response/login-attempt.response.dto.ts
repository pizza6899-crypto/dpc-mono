import { ApiProperty } from '@nestjs/swagger';

export class LoginAttemptResponseDto {
  @ApiProperty({ description: 'Internal ID / 내부 ID', type: 'string' })
  id: string;

  @ApiProperty({ description: 'User ID / 사용자 ID', type: 'string', nullable: true })
  userId: string | null;

  @ApiProperty({ description: 'Result (SUCCESS/FAILED) / 결과 (성공/실패)' })
  result: string;

  @ApiProperty({ description: 'Failure Reason / 실패 이유', nullable: true })
  failureReason: string | null;

  @ApiProperty({ description: 'IP Address / IP 주소', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Login ID / 로그인 ID', nullable: true })
  loginId: string | null;

  @ApiProperty({ description: 'Attempted At / 시도 시간' })
  attemptedAt: Date;

  @ApiProperty({ description: 'Is Admin Attempt / 관리자 시도 여부' })
  isAdmin: boolean;
}
