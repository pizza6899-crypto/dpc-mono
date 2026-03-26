import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactLogType } from '@prisma/client';
import { ArtifactBonusPoolLogDetails } from '../../../../domain/artifact-bonus-pool-log.entity';

/**
 * [Artifact Audit Admin] 보너스 풀 로그 요약 응답 DTO
 */
export class ArtifactBonusPoolLogAdminSummaryResponseDto {
  @ApiProperty({
    description: 'Log ID / 로그 식별자',
    example: '1001',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User ID / 관련 유저 식별자',
    example: '2001',
  })
  userId?: string;

  @ApiProperty({
    description: 'Amount Usd / 변동 금액 (Decimal)',
    example: '10.50',
  })
  amountUsd: string;

  @ApiProperty({
    description: 'Log Type / 로그 타입',
    enum: ArtifactLogType,
    example: ArtifactLogType.DISTRIBUTION,
  })
  type: ArtifactLogType;

  @ApiProperty({
    description: 'Details / 활동 상세 정보',
    example: { amount: 10.5, reason: 'Contribution' },
  })
  details: ArtifactBonusPoolLogDetails | null;

  @ApiProperty({
    description: 'Created At / 생성 시각',
    example: '2024-03-26T16:43:12Z',
  })
  createdAt: Date;
}
