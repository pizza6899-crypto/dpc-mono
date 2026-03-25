import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

/**
 * 단일 등급 가챠 확률 정보
 */
export class UpdateDrawConfigItemAdminRequestDto {
  @ApiProperty({ description: 'Artifact grade / 확률 설정 타겟 등급', enum: ArtifactGrade, example: ArtifactGrade.EPIC })
  @IsEnum(ArtifactGrade)
  @IsNotEmpty()
  grade: ArtifactGrade;

  @ApiProperty({ description: 'Probability value (0.0 to 1.0) / 당첨 확률 (단위: 0.0 ~ 1.0)', example: 0.105 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(1)
  probability: number;
}