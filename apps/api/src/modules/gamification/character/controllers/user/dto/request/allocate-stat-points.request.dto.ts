import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, Max } from 'class-validator';
import { UserStats } from '../../../../domain/user-character.entity';

export enum StatType {
  STRENGTH = 'strength',
  AGILITY = 'agility',
  LUCK = 'luck',
  WISDOM = 'wisdom',
  STAMINA = 'stamina',
  CHARISMA = 'charisma',
}

export class AllocateStatPointsRequestDto {
  @ApiProperty({ enum: StatType, description: 'Target stat name / 투자할 스탯명' })
  @IsEnum(StatType)
  statName: keyof UserStats;

  @ApiProperty({ example: 1, description: 'Number of points to allocate / 투자할 배분 포인트 개수', minimum: 1, maximum: 100 })
  @IsInt()
  @IsPositive()
  @Max(100)
  points: number;
}
