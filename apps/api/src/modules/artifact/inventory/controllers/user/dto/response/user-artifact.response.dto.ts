import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Inventory] 개별 유물 정보 응답 DTO
 */
export class UserArtifactResponseDto {
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

  @ApiPropertyOptional({
    description: 'Equipped Slot Number (null if not equipped) / 장착 슬롯 번호',
    example: 1,
    nullable: true,
  })
  slotNo?: number | null;

  @ApiProperty({
    description: 'Is Equipped / 장착 여부',
    example: false,
  })
  isEquipped: boolean;


  @ApiPropertyOptional({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.COMMON,
  })
  grade?: ArtifactGrade;

  @ApiProperty({
    description: 'Acquired Date / 획득 일시',
    example: '2024-03-27T10:00:00Z',
  })
  acquiredAt: Date;
}
