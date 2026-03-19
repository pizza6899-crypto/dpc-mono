import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VoidRewardRequestDto {
  @ApiPropertyOptional({ description: 'Reason for voiding / 취소 사유 (옵션)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
