import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class ForceUpdateTierRequestDto {
  @ApiProperty({
    description: 'Target tier ID to force update / 강제 변경할 대상 티어 ID',
  })
  @IsString()
  targetTierId: string;

  @ApiProperty({
    description: 'Reason for manual tier update / 수동 티어 변경 사유',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Whether to grant upgrade bonus / 승급 보너스 지급 여부',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isGrantBonus?: boolean;
}
