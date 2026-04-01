import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade, ArtifactDrawStatus } from '@prisma/client';

export class DrawnItemDto {
  @ApiProperty({ description: 'Encoded User Artifact ID (uar_...) / Sqids로 인코딩된 유물 소유 ID' })
  id: string;

  @ApiProperty({ description: 'Artifact Catalog Code / 유물 카탈로그 코드' })
  artifactId: string;

  @ApiProperty({ enum: ArtifactGrade, description: 'Artifact Grade / 유물 등급' })
  grade: ArtifactGrade;
}

export class DrawResultResponseDto {
  @ApiProperty({ description: 'Encoded Draw Request ID (adr_...) / Sqids로 인코딩된 뽑기 요청 ID' })
  requestId: string;

  @ApiProperty({ enum: ArtifactDrawStatus, description: 'Current Status / 현재 상태 (SETTLED, CLAIMED)' })
  status: ArtifactDrawStatus;

  @ApiProperty({ type: [DrawnItemDto], description: 'Drawn Items / 당첨된 유물 리스트' })
  items: DrawnItemDto[];

  @ApiProperty({ description: 'Settlement Time / 결과 확정 시각' })
  settledAt?: Date;

  @ApiProperty({ description: 'Claimed Time / 유저 확인 시각' })
  claimedAt?: Date;
}
