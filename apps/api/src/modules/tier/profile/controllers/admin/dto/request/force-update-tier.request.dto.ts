import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
}
