import { ApiProperty } from '@nestjs/swagger';
import { UserCharacter } from '../../../../domain/user-character.entity';

export class UserStatsDto {
  @ApiProperty({ example: 10, description: 'Strength / 근력' }) strength: number;
  @ApiProperty({ example: 10, description: 'Agility / 민첩' }) agility: number;
  @ApiProperty({ example: 10, description: 'Luck / 행운' }) luck: number;
  @ApiProperty({ example: 10, description: 'Wisdom / 지혜' }) wisdom: number;
  @ApiProperty({ example: 10, description: 'Stamina / 체력' }) stamina: number;
  @ApiProperty({ example: 10, description: 'Charisma / 매력' }) charisma: number;
}

export class UserCharacterResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID' }) userId: string;
  @ApiProperty({ description: 'Current Level / 현재 레벨' }) level: number;
  @ApiProperty({ description: 'Current XP / 현재 경험치' }) xp: string;
  @ApiProperty({ description: 'Available Stat Points / 사용 가능한 스탯 포인트' }) statPoints: number;
  @ApiProperty({ description: 'Total Earned Stat Points / 획득한 총 스탯 포인트' }) totalStatPoints: number;
  @ApiProperty({ description: 'Core Stats / 핵심 스탯' }) stats: UserStatsDto;
  @ApiProperty({ description: 'Stat Reset Count / 스탯 초기화 횟수' }) statResetCount: number;
  @ApiProperty({ nullable: true, description: 'Currently Equipped Title / 현재 장착 중인 칭호' }) currentTitle: string | null;
  @ApiProperty({ nullable: true, description: 'Last Leveled Up At / 마지막 레벨업 일시' }) lastLeveledUpAt: Date | null;

  static fromDomain(domain: UserCharacter): UserCharacterResponseDto {
    return {
      userId: domain.userId.toString(),
      level: domain.level,
      xp: domain.xp.toString(),
      statPoints: domain.statPoints,
      totalStatPoints: domain.totalStatPoints,
      stats: {
        strength: domain.strength,
        agility: domain.agility,
        luck: domain.luck,
        wisdom: domain.wisdom,
        stamina: domain.stamina,
        charisma: domain.charisma,
      },
      statResetCount: domain.statResetCount,
      currentTitle: domain.currentTitle,
      lastLeveledUpAt: domain.lastLeveledUpAt,
    };
  }
}
