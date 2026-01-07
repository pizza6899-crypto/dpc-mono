import { ApiProperty } from '@nestjs/swagger';

export class RevokeSessionResponseDto {
  @ApiProperty({
    description: '세션 UID',
    example: 'session-1234567890',
  })
  uid: string;

  @ApiProperty({
    description: '세션 ID',
    example: 'sess-abc123',
  })
  sessionId: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  userId: string;

}

export class RevokeUserSessionsResponseDto {
  @ApiProperty({
    description: '종료된 세션 수',
    example: 3,
  })
  revokedCount: number;

  @ApiProperty({
    description: '사용자 ID',
    example: '1234567890123456789',
    type: String,
  })
  userId: string;
}

