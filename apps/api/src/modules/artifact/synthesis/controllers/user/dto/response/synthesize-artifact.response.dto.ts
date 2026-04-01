import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Synthesis] 합성 결과 획독 유물 정보 (DTO 독립성 유지를 위해 인라인 정의)
 */
export class SynthesizeRewardArtifactDto {
  @ApiProperty({
    description: 'User Artifact ID (Sqid) / 유저 유물 식별자',
    example: 'sqid_artifact_1',
  })
  id: string;

  @ApiProperty({
    description: 'Artifact Catalog Code / 유물 카테고리 코드 (Unique Code)',
    example: 'ART_HEAL_01',
  })
  artifactCode: string;

  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.RARE,
  })
  grade: ArtifactGrade;

  @ApiProperty({
    description: 'Acquired Date / 획득 일시',
    example: '2024-03-27T10:00:00Z',
  })
  acquiredAt: Date;
}

/**
 * [Artifact Synthesis] 유물 합성 결과 응답 DTO
 */
export class SynthesizeArtifactResponseDto {
  @ApiProperty({
    description: 'Synthesis Success Status / 합성 성공 여부',
    example: true,
  })
  isSuccess: boolean;

  @ApiPropertyOptional({
    description: 'Result Artifact (only if success) / 합성 결과 유물 (성공 시에만 포함)',
    type: SynthesizeRewardArtifactDto,
  })
  reward?: SynthesizeRewardArtifactDto | null;

  @ApiProperty({
    description: 'Total Fail Count for this grade / 해당 등급의 현재 누적 실패 횟수 (Pity 체크용)',
    example: 3,
  })
  currentFailCount: number;

  @ApiPropertyOptional({
    description: 'Was it a guaranteed success (Pity)? / 확정 성공(천장) 여부',
    example: false,
  })
  isGuaranteed?: boolean;
}
