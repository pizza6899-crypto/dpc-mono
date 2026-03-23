import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

/**
 * 관리자용 경험치(XP) 조정 요청 DTO
 */
export class AdjustXpAdminRequestDto {
  @ApiProperty({ example: 100, description: 'Amount of XP to add or subtract / 가감할 경험치량' })
  @IsNumber()
  @Min(-10000000)
  @Max(10000000)
  amount: number;

  @ApiProperty({ example: 'Manual Reward for Event', description: 'Reason for adjustment / 조정 사유' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
