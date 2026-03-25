import { ApiProperty } from '@nestjs/swagger';

/**
 * [Admin] 캐릭터 핵심 능력치 응답 DTO (독립 정의)
 */
export class UserCharacterAdminStatsResponseDto {
  @ApiProperty({ example: 10, description: 'Casino Benefit / 카지노 혜택' }) casinoBenefit: number;
  @ApiProperty({ example: 10, description: 'Slot Benefit / 슬롯 혜택' }) slotBenefit: number;
  @ApiProperty({ example: 10, description: 'Sports Benefit / 스포츠 혜택' }) sportsBenefit: number;
  @ApiProperty({ example: 10, description: 'Minigame Benefit / 미니게임 혜택' }) minigameBenefit: number;
  @ApiProperty({ example: 10, description: 'Bad Beat Jackpot / 배드빗 잭팟' }) badBeatJackpot: number;
  @ApiProperty({ example: 10, description: 'Critical Jackpot / 크리티컬 잭팟' }) criticalJackpot: number;
}

/**
 * [Admin] 캐릭터 정보 응답 DTO
 * 유저용 DTO와 공유 혹은 상속받지 않는 완전 독립된 구조입니다.
 */
export class UserCharacterAdminResponseDto {
  @ApiProperty({ description: 'User ID / 사용자 ID', example: '1234567890' })
  userId: string;

  @ApiProperty({ description: 'Current Level / 현재 레벨', example: 10 })
  level: number;

  @ApiProperty({ description: 'Current XP / 현재 경험치', example: '1500.50' })
  xp: string;

  @ApiProperty({ description: 'Available Stat Points / 사용 가능한 스탯 포인트', example: 5 })
  statPoints: number;

  @ApiProperty({ description: 'Total Earned Stat Points / 획득한 총 스탯 포인트', example: 50 })
  totalStatPoints: number;

  @ApiProperty({ description: 'Core Stats / 핵심 스탯' })
  stats: UserCharacterAdminStatsResponseDto;

  @ApiProperty({ description: 'Stat Reset Count / 스탯 초기화 횟수', example: 0 })
  statResetCount: number;

  @ApiProperty({ nullable: true, description: 'Currently Equipped Title / 현재 장착 중인 칭호', example: 'Novice / 초보자' })
  currentTitle: string | null;

  @ApiProperty({ nullable: true, description: 'Last Leveled Up At / 마지막 레벨업 일시', example: '2026-03-23T10:00:00Z' })
  lastLeveledUpAt: Date | null;
}
