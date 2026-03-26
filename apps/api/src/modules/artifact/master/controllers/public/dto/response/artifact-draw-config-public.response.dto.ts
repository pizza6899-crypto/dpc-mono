import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Public] 유물 뽑기 확률 정보 응답 DTO
 */
export class ArtifactDrawConfigPublicResponseDto {
  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.COMMON,
  })
  grade: ArtifactGrade;

  @ApiProperty({
    description: 'Winning Probability (0.00 ~ 1.00) / 당첨 확률 (0.00 ~ 1.00)',
    example: '0.05',
  })
  probability: string; // Decimal string
}
