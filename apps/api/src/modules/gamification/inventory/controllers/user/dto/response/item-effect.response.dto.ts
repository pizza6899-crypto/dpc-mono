import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EffectType } from '@prisma/client';

export class ItemEffectResponseDto {
  @ApiProperty({ enum: EffectType, description: 'Effect Type / 효과 타입' })
  type: EffectType;

  @ApiProperty({ description: 'Value / 수치', example: 10 })
  value: number;

  @ApiPropertyOptional({ description: 'Target / 대상', example: 'STR' })
  target?: string;
}
