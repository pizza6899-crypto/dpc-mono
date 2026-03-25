import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, Max } from 'class-validator';

export enum StatType {
  CASINO_BENEFIT = 'casinoBenefit',
  SLOT_BENEFIT = 'slotBenefit',
  SPORTS_BENEFIT = 'sportsBenefit',
  MINIGAME_BENEFIT = 'minigameBenefit',
  BAD_BEAT_JACKPOT = 'badBeatJackpot',
  CRITICAL_JACKPOT = 'criticalJackpot',
}

export class AllocateStatPointsRequestDto {
  @ApiProperty({ enum: StatType, description: 'Target stat name / 투자할 스탯명' })
  @IsEnum(StatType)
  statName: StatType;

  @ApiProperty({ example: 1, description: 'Number of points to allocate / 투자할 배분 포인트 개수', minimum: 1, maximum: 100 })
  @IsInt()
  @IsPositive()
  @Max(100)
  points: number;
}
