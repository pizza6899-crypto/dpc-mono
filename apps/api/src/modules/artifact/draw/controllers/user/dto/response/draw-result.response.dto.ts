import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Draw] 단일 뽑기 결과 항목 DTO
 */
export class DrawResultItemResponseDto {
  @ApiProperty({
    description: 'User Artifact ID (Sqid) / 생성된 유저 유물 식별자',
    example: 'sqid_artifact_1',
  })
  id: string;

  @ApiProperty({
    description: 'Artifact Catalog ID (Master) / 원형 유물 식별자',
    example: '101',
  })
  artifactId: string;

  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.RARE,
  })
  grade: ArtifactGrade;

  @ApiProperty({
    description: 'Whether pity was applied / 천장(Pity) 적용 여부',
    example: false,
  })
  isPity: boolean;
}

/**
 * [Artifact Draw] 뽑기 전체 결과 응답 DTO
 */
export class DrawResultResponseDto {
  @ApiProperty({
    description: 'List of objects drawn / 획득한 유물 목록',
    type: [DrawResultItemResponseDto],
  })
  items: DrawResultItemResponseDto[];

  @ApiProperty({
    description: 'Current Pity Stack Count (after draw) / 현재 누적 천장 스택',
    example: 25,
  })
  currentPityCount: number;
}
