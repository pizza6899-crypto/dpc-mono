import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';
import type { ArtifactSynthesisConfigTable } from '../../../../domain/artifact-policy.entity';

/**
 * 유물 합성 확률/비용 업데이트 요청 DTO
 */
export class UpdateArtifactSynthesisConfigsAdminRequestDto {
  @ApiProperty({
    description: 'Synthesis configs table / 유물 합성 확률 및 비용 설정 테이블',
    example: {
      COMMON: { requiredCount: 3, successRate: 0.8 },
      UNCOMMON: { requiredCount: 3, successRate: 0.6 },
    },
  })
  @IsObject()
  @IsNotEmpty()
  synthesisConfigs: Partial<ArtifactSynthesisConfigTable>;
}
