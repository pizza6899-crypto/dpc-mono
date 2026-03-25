import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';
import type { ArtifactDrawPriceTable } from '../../../../domain/artifact-policy.entity';

/**
 * 유물 뽑기 비용 업데이트 요청 DTO
 */
export class UpdateArtifactDrawPricesAdminRequestDto {
  @ApiProperty({
    description: 'Draw prices table / 유물 뽑기 비용 설정 테이블',
    example: {
      SINGLE: { USDT: 100 },
      TEN: { USDT: 1000 },
    },
  })
  @IsObject()
  @IsNotEmpty()
  drawPrices: ArtifactDrawPriceTable;
}
