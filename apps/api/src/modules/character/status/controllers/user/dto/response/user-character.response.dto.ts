import { ApiProperty } from '@nestjs/swagger';

/**
 * 캐릭터 핵심 능력치 응답 DTO
 */
export class UserCharacterStatsResponseDto {
  @ApiProperty({ example: 10, description: 'Casino Benefit / 카지노 혜택' }) casinoBenefit: number;
  @ApiProperty({ example: 10, description: 'Slot Benefit / 슬롯 혜택' }) slotBenefit: number;
  @ApiProperty({ example: 10, description: 'Sports Benefit / 스포츠 혜택' }) sportsBenefit: number;
  @ApiProperty({ example: 10, description: 'Minigame Benefit / 미니게임 혜택' }) minigameBenefit: number;
  @ApiProperty({ example: 10, description: 'Bad Beat Jackpot / 배드빗 잭팟' }) badBeatJackpot: number;
  @ApiProperty({ example: 10, description: 'Critical Jackpot / 크리티컬 잭팟' }) criticalJackpot: number;
}

/**
 * 내 캐릭터 정보 응답 DTO
 * (Presentation 레이어의 순수성을 보장하며 도메인 엔티티를 직접 참조하지 않습니다)
 */
export class UserCharacterResponseDto {
  @ApiProperty({ description: 'Current Level / 현재 레벨', example: 10 })
  level: number;

  @ApiProperty({ description: 'Current XP / 현재 경험치', example: '1500.50' })
  xp: string;

  @ApiProperty({ description: 'Available Stat Points / 사용 가능한 스탯 포인트', example: 5 })
  statPoints: number;

  @ApiProperty({ description: 'Total Earned Stat Points / 획득한 총 스탯 포인트', example: 50 })
  totalStatPoints: number;

  @ApiProperty({
    description: 'Base Stats (from points) / 순수 투자 스탯',
    type: UserCharacterStatsResponseDto,
  })
  baseStats: UserCharacterStatsResponseDto;

  @ApiProperty({
    description: 'Total Combined Stats / 최종 통합 스탯 (베이스 + 보너스)',
    type: UserCharacterStatsResponseDto,
  })
  totalStats: UserCharacterStatsResponseDto;
}
