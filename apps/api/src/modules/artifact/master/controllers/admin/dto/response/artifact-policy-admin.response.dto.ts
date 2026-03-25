import { ApiProperty } from '@nestjs/swagger';
import type { ArtifactDrawPriceTable, ArtifactSlotUnlockConfig, ArtifactSynthesisConfigTable } from '../../../../domain/artifact-policy.entity';

/**
 * [Artifact] 유물 정책 정보 응답 DTO
 */
export class ArtifactPolicyAdminResponseDto {
  @ApiProperty({
    description: 'Draw prices table / 유물 뽑기 비용 설정 테이블',
    example: {
      SINGLE: { USDT: 100 },
      TEN: { USDT: 1000 },
    },
  })
  drawPrices: ArtifactDrawPriceTable;

  @ApiProperty({
    description: 'Synthesis configs table / 유물 합성 확률 및 비용 설정 테이블',
    example: {
      COMMON: { requiredCount: 3, successRate: 0.8 },
      UNCOMMON: { requiredCount: 3, successRate: 0.6 },
    },
  })
  synthesisConfigs: ArtifactSynthesisConfigTable;

  @ApiProperty({
    description: 'Slot unlock configs / 유물 슬롯 해금 설정',
    example: { unlockLevels: [1, 1, 5, 10] },
  })
  slotUnlockConfigs: ArtifactSlotUnlockConfig;

  @ApiProperty({
    description: 'Updated at / 최종 수정일',
    example: '2024-03-25T15:00:00Z',
  })
  updatedAt: Date;
}
