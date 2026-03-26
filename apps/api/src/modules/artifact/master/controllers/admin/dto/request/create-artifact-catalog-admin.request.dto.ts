import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * [Artifact] 신규 유물 마스터 데이터 등록 요청 DTO
 */
export class CreateArtifactCatalogAdminRequestDto {
  @ApiProperty({ description: 'Artifact Code / 유물 고유 코드', example: 'ART_001' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Artifact Grade / 유물 등급', enum: ArtifactGrade })
  @IsEnum(ArtifactGrade)
  @IsNotEmpty()
  grade: ArtifactGrade;

  @ApiProperty({ description: 'Draw Weight / 동일 등급 내 가중치', example: 1000, default: 1000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  drawWeight?: number;

  @ApiProperty({ description: 'Casino Benefit bonus value / 카지노 혜택 보너스', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  casinoBenefit?: number;

  @ApiProperty({ description: 'Slot Benefit bonus value / 슬롯 혜택 보너스', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  slotBenefit?: number;

  @ApiProperty({ description: 'Sports Benefit bonus value / 스포츠 혜택 보너스', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sportsBenefit?: number;

  @ApiProperty({ description: 'Minigame Benefit bonus value / 미니게임 혜택 보너스', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minigameBenefit?: number;

  @ApiProperty({ description: 'Bad Beat Benefit / 배드빗 낙첨 보조 혜택', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  badBeatBenefit?: number;

  @ApiProperty({ description: 'Critical Jackpot Benefit / 크리티컬 잭팟 혜택', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  criticalBenefit?: number;

  @ApiProperty({ description: 'Ref File ID / 유물 이미지 파일 ID (Service에서 URL로 변환)' })
  @IsString()
  @IsNotEmpty()
  fileId: string;
}
