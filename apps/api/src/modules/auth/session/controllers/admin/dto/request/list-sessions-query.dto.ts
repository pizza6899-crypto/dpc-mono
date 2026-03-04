import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { SessionType, SessionStatus } from '../../../../domain';

type SessionSortFields =
  | 'createdAt'
  | 'updatedAt'
  | 'lastActiveAt'
  | 'expiresAt';

export class ListSessionsQueryDto extends createPaginationQueryDto<SessionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'lastActiveAt', 'expiresAt'],
) {
  @ApiPropertyOptional({
    description: '사용자 ID 필터 / User ID filter',
    example: '1234567890123456789',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: '세션 상태 필터 / Session status filter',
    enum: SessionStatus,
    example: SessionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({
    description: '세션 타입 필터 / Session type filter',
    enum: SessionType,
    example: SessionType.HTTP,
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    description: '부모 세션 ID 필터',
    example: 'sess-parent123',
  })
  @IsOptional()
  @IsString()
  parentSessionId?: string;

  @ApiPropertyOptional({
    description: '활성 세션만 조회할지 여부 (기본값: false) / Whether to retrieve only active sessions (default: false)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식) - 생성일 기준 / Start date (ISO 8601 format) - based on creation date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식) - 생성일 기준 / End date (ISO 8601 format) - based on creation date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
