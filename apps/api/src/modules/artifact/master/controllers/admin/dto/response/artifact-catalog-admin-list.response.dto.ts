import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Admin] 유물 카탈로그 목록 요약 응답 DTO
 */
export class ArtifactCatalogAdminSummaryResponseDto {
  @ApiProperty({ description: 'Catalog ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Artifact Code / 유물 고유 코드', example: 'ART_001' })
  code: string;

  @ApiProperty({ description: 'Artifact Grade / 유물 등급', enum: ArtifactGrade, example: ArtifactGrade.COMMON })
  grade: ArtifactGrade;

  @ApiProperty({ description: 'Draw Weight / 동일 등급 내 가중치', example: 1000 })
  drawWeight: number;

  @ApiProperty({ description: 'Image URL / 유물 이미지 URL', required: false, example: 'https://storage.example.com/artifacts/ART_001.png' })
  imageUrl?: string;

  @ApiProperty({ description: 'Casino Benefit bonus value / 카지노 혜택 보너스', example: 10 })
  casinoBenefit: number;

  @ApiProperty({ description: 'Slot Benefit bonus value / 슬롯 혜택 보너스', example: 0 })
  slotBenefit: number;

  @ApiProperty({ description: 'Sports Benefit bonus value / 스포츠 혜택 보너스', example: 5 })
  sportsBenefit: number;

  @ApiProperty({ description: 'Minigame Benefit bonus value / 미니게임 혜택 보너스', example: 0 })
  minigameBenefit: number;

  @ApiProperty({ description: 'Bad Beat Benefit / 배드빗 낙첨 보조 혜택', example: 0 })
  badBeatBenefit: number;

  @ApiProperty({ description: 'Critical Jackpot Benefit / 크리티컬 잭팟 혜택', example: 0 })
  criticalBenefit: number;

  @ApiProperty({ description: 'Registered at / 등록 일시', example: '2024-03-26T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at / 수정 일시', example: '2024-03-26T12:00:00Z' })
  updatedAt: Date;
}
