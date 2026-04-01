import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Synthesis] 합성 결과 획득 유물 정보 (DTO 독립성 유지를 위해 인라인 정의)
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
    description: 'Result Artifact / 합성 결과 유물 (성공/실패 관계없이 지급된 새 유물)',
    type: SynthesizeRewardArtifactDto,
  })
  reward?: SynthesizeRewardArtifactDto | null;

  @ApiProperty({
    description: 'Current Pity Stack (Reset on success) / 현재 천장 스택 (성공 시 리셋)',
    example: 3,
  })
  currentPityCount: number;

  @ApiPropertyOptional({
    description: 'Was it a guaranteed success (Pity)? / 확정 성공(천장) 여부',
    example: false,
  })
  isGuaranteed?: boolean;
}
