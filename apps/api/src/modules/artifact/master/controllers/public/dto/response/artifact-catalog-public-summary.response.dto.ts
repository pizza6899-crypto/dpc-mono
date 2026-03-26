import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Public] 유물 도감 요약 정보 응답 DTO
 */
export class ArtifactCatalogPublicSummaryResponseDto {
  @ApiProperty({
    description: 'Encoded Artifact ID / 인코딩된 유물 ID',
    example: 'yV6k8z',
  })
  id: string;

  @ApiProperty({
    description: 'Artifact Code / 유물 코드',
    example: 'ART_001',
  })
  code: string;

  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.COMMON,
  })
  grade: ArtifactGrade;

  @ApiProperty({
    description: 'Image URL / 유물 이미지 URL',
    required: false,
    example: 'https://api.example.com/artifacts/art_001.png',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Artifact Draw Weight / 유물 뽑기 가중치',
    example: 100,
  })
  drawWeight: number;

  @ApiProperty({
    description: 'Casino Benefit bonus value (int) / 카지노 혜택 보너스 수치 (정수)',
    example: 5,
  })
  casinoBenefit: number;

  @ApiProperty({
    description: 'Slot Benefit bonus value (int) / 슬롯 혜택 보너스 수치 (정수)',
    example: 3,
  })
  slotBenefit: number;

  @ApiProperty({
    description: 'Sports Benefit bonus value (int) / 스포츠 혜택 보너스 수치 (정수)',
    example: 2,
  })
  sportsBenefit: number;

  @ApiProperty({
    description: 'Minigame Benefit bonus value (int) / 미니게임 혜택 보너스 수치 (정수)',
    example: 4,
  })
  minigameBenefit: number;

  @ApiProperty({
    description: 'Bad Beat Benefit (int) / 배드비트 혜택 (정수)',
    example: 1,
  })
  badBeatBenefit: number;

  @ApiProperty({
    description: 'Critical Jackpot Benefit (int) / 크리티컬 잭팟 혜택 (정수)',
    example: 2,
  })
  criticalBenefit: number;
}
