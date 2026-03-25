import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TierCode } from '@prisma/client';

/**
 * 레벨 정의 상세 응답 DTO
 */
export class LevelDefinitionAdminResponseDto {
  @ApiProperty({ description: 'Level / 레벨 (기본키)', example: 1 })
  level: number;

  @ApiProperty({ description: 'Required XP to reach / 도달에 필요한 경험치', example: '100' })
  requiredXp: string;

  @ApiProperty({ description: 'Tier category for this level / 해당 레벨의 티어 분류', enum: TierCode, example: TierCode.WHITE })
  tierCode: TierCode;

  @ApiPropertyOptional({ description: 'Tier image URL / 티어 뱃지 이미지 URL', example: 'https://...' })
  tierImageUrl: string | null;

  @ApiProperty({ description: 'Bonus stat points granted / 부여되는 기본 보너스 스탯', example: 1 })
  statPointsBoost: number;

  @ApiProperty({ description: 'Last update time / 최종 수정 시간' })
  updatedAt: Date;
}
