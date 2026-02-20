import { ApiProperty } from '@nestjs/swagger';
import { SessionType, SessionStatus } from '../../../../domain';

export class DeviceInfoDto {
  @ApiProperty({
    description: 'IP 주소',
    example: '192.168.1.1',
    nullable: true,
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'User Agent',
    example: 'Mozilla/5.0...',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: '디바이스 핑거프린트',
    example: 'fingerprint-123',
    nullable: true,
  })
  deviceFingerprint: string | null;

  @ApiProperty({
    description: '모바일 디바이스 여부',
    example: false,
    nullable: true,
  })
  isMobile: boolean | null;

  @ApiProperty({
    description: '디바이스 이름',
    example: 'iPhone 14 Pro',
    nullable: true,
  })
  deviceName: string | null;

  @ApiProperty({
    description: '운영체제',
    example: 'iOS 17.0',
    nullable: true,
  })
  os: string | null;

  @ApiProperty({
    description: '브라우저',
    example: 'Safari 17',
    nullable: true,
  })
  browser: string | null;
}

export class SessionListItemDto {
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

  @ApiProperty({
    description: '세션 타입',
    enum: SessionType,
    example: SessionType.HTTP,
  })
  type: SessionType;

  @ApiProperty({
    description: '세션 상태',
    enum: SessionStatus,
    example: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @ApiProperty({
    description: '디바이스 정보',
    type: DeviceInfoDto,
  })
  deviceInfo: DeviceInfoDto;

  @ApiProperty({
    description: '생성 시간',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '마지막 업데이트 시간',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '마지막 활동 시간',
    example: '2024-01-01T00:00:00Z',
  })
  lastActiveAt: Date;

  @ApiProperty({
    description: '만료 시간',
    example: '2024-01-08T00:00:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: '종료 시간 (REVOKED 상태일 때)',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  revokedAt: Date | null;

  @ApiProperty({
    description: '종료한 사용자 ID (관리자가 종료한 경우)',
    example: '9876543210987654321',
    type: String,
    nullable: true,
  })
  revokedBy: string | null;
}

export class SessionListResponseDto {
  @ApiProperty({
    description: '세션 목록',
    type: [SessionListItemDto],
  })
  sessions: SessionListItemDto[];
}
