import { ApiProperty } from '@nestjs/swagger';

/**
 * 캐릭터 핵심 능력치 응답 DTO
 */
export class UserCharacterStatsResponseDto {
  @ApiProperty({ example: 10, description: 'Strength / 근력' }) strength: number;
  @ApiProperty({ example: 10, description: 'Agility / 민첩' }) agility: number;
  @ApiProperty({ example: 10, description: 'Luck / 행운' }) luck: number;
  @ApiProperty({ example: 10, description: 'Wisdom / 지혜' }) wisdom: number;
  @ApiProperty({ example: 10, description: 'Stamina / 체력' }) stamina: number;
  @ApiProperty({ example: 10, description: 'Charisma / 매력' }) charisma: number;
}

/**
 * 내 캐릭터 정보 응답 DTO
 * (Presentation 레이어의 순수성을 보장하며 도메인 엔티티를 직접 참조하지 않습니다)
 */
export class UserCharacterResponseDto {
  @ApiProperty({ description: 'Current Level / 현재 레벨', example: 10 }) level: number;
  @ApiProperty({ description: 'Current XP / 현재 경험치', example: '1500.50' }) xp: string;
  @ApiProperty({ description: 'Available Stat Points / 사용 가능한 스탯 포인트', example: 5 }) statPoints: number;
  @ApiProperty({ description: 'Total Earned Stat Points / 획득한 총 스탯 포인트', example: 50 }) totalStatPoints: number;
  @ApiProperty({ description: 'Core Stats / 핵심 스탯' }) stats: UserCharacterStatsResponseDto;
  @ApiProperty({ description: 'Stat Reset Count / 스탯 초기화 횟수', example: 0 }) statResetCount: number;
  @ApiProperty({ nullable: true, description: 'Currently Equipped Title / 현재 장착 중인 칭호', example: 'Novice / 초보자' }) currentTitle: string | null;
  @ApiProperty({ nullable: true, description: 'Last Leveled Up At / 마지막 레벨업 일시', example: '2026-03-23T10:00:00Z' }) lastLeveledUpAt: Date | null;
}
