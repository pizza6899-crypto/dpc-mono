import { ApiProperty } from '@nestjs/swagger';
import { EffectType } from '@prisma/client';

export class ItemEffectPublicResponseDto {
  @ApiProperty({ description: 'Effect Type / 효과 타입', enum: EffectType })
  type: EffectType;

  @ApiProperty({ description: 'Numeric value of the effect / 효과 수치', example: 10 })
  value: number;

  @ApiProperty({ description: 'Target parameter (e.g., STR, LUC) / 적용 대상', example: 'STR', required: false })
  target?: string;
}
