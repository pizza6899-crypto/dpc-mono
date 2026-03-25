import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * 유물 뽑기 확률 설정 상세 응답 DTO
 */
export class ArtifactDrawConfigAdminResponseDto {
  @ApiProperty({
    description: 'Target grade for draw configuration / 확률 대상을 나타내는 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.LEGENDARY
  })
  grade: ArtifactGrade;

  @ApiProperty({
    description: 'Percentage probability (0.0 to 1.0) / 당첨 확률 (단위: 0.0 ~ 1.0)',
    example: 0.05
  })
  probability: number;

  @ApiProperty({
    description: 'Last updated timestamp / 최종 수정일시',
    example: '2024-03-25T13:00:00.000Z'
  })
  updatedAt: Date;
}

