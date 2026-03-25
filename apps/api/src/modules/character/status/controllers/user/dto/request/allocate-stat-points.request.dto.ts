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

export enum AllocateMode {
  INC = 'INC',
  DEC = 'DEC',
  MAX = 'MAX',
}

export class AllocateStatPointsRequestDto {
  @ApiProperty({ enum: StatType, description: 'Target stat name / 투자할 스탯명' })
  @IsEnum(StatType)
  statName: StatType;

  @ApiProperty({
    enum: AllocateMode,
    default: AllocateMode.INC,
    description: 'Allocation Mode (INC: Increase by points, DEC: Decrease by 1, MAX: Increase to max) / 투자 모드 (INC: 수치만큼 증가, DEC: 1 감소, MAX: 최대치 증가)',
  })
  @IsEnum(AllocateMode)
  mode: AllocateMode = AllocateMode.INC;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Number of points to allocate (Required only for INC mode) / 투자할 배분 포인트 개수 (INC 모드 시에만 필수)',
    minimum: 1,
    maximum: 1000,
  })
  @IsInt()
  @IsPositive()
  @Max(1000)
  points: number = 1;
}
