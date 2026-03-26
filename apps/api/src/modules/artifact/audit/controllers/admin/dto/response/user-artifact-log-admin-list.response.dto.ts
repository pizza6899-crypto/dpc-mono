import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade, ArtifactLogType, ExchangeCurrencyCode } from '@prisma/client';
import { UserArtifactLogDetails } from '../../../../domain/user-artifact-log.entity';

/**
 * [Artifact Audit Admin] 유물 관련 활동 로그 요약 응답 DTO
 */
export class UserArtifactLogAdminSummaryResponseDto {
  @ApiProperty({
    description: 'Log ID / 로그 식별자',
    example: '10001',
  })
  id: string;

  @ApiProperty({
    description: 'User ID / 유저 식별자',
    example: '20001',
  })
  userId: string;

  @ApiProperty({
    description: 'Artifact ID / 유물 식별자',
    example: '30001',
  })
  artifactId: string;

  @ApiProperty({
    description: 'Log Type / 로그 타입',
    enum: ArtifactLogType,
    example: ArtifactLogType.DRAW,
  })
  type: ArtifactLogType;

  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.UNCOMMON,
  })
  grade: ArtifactGrade;

  @ApiPropertyOptional({
    description: 'Cost / 소모 비용 (Decimal)',
    example: '5.25',
  })
  cost?: string;

  @ApiPropertyOptional({
    description: 'Currency / 비용 통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  currency?: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Details / 활동 상세 정보',
    example: { previousGrade: 'COMMON', currentGrade: 'UNCOMMON' },
  })
  details: UserArtifactLogDetails | null;

  @ApiProperty({
    description: 'Created At / 생성 시각',
    example: '2024-03-26T16:43:12Z',
  })
  createdAt: Date;
}
