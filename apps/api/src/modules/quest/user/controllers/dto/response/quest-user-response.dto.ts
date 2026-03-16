import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestType, UserQuestStatus, ResetCycle, ExchangeCurrencyCode, RewardType } from '@prisma/client';

export class QuestRewardUserResponseDto {
  @ApiProperty({
    description: 'Reward type / 보상 유형',
    enum: RewardType,
    example: RewardType.BONUS_MONEY
  })
  type: RewardType;

  @ApiPropertyOptional({
    description: 'Reward currency / 보상 통화',
    enum: ExchangeCurrencyCode,
    nullable: true,
    example: ExchangeCurrencyCode.USD
  })
  currency: ExchangeCurrencyCode | null;

  @ApiPropertyOptional({
    description: 'Reward amount / 보상 금액 (보너스 머니 등)',
    nullable: true,
    example: 10.5
  })
  amount: number | null;

  @ApiPropertyOptional({
    description: 'Reward point / 지급 포인트',
    nullable: true,
    example: 100
  })
  point: number | null;
}

export class QuestUserResponseDto {
  @ApiProperty({
    description: 'Quest ID (Sqid) / 퀘스트 ID (Sqid)',
    example: 'a1b2c3d4'
  })
  id: string;

  @ApiProperty({
    description: 'Quest type / 퀘스트 유형',
    enum: QuestType,
    example: QuestType.DEPOSIT
  })
  type: QuestType;


  @ApiProperty({
    description: 'Quest reset cycle / 퀘스트 초기화 주기',
    enum: ResetCycle,
    example: ResetCycle.DAILY
  })
  resetCycle: ResetCycle;

  @ApiProperty({
    description: 'Quest title / 퀘스트 제목',
    example: 'First Deposit Bonus'
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Quest description / 퀘스트 설명',
    nullable: true,
    example: 'Get a bonus on your first deposit!'
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Quest icon URL / 퀘스트 아이콘 URL',
    nullable: true,
    example: 'https://cdn.example.com/icons/quest-1.png'
  })
  iconUrl: string | null;

  @ApiProperty({
    description: 'Is hot quest / 인기 퀘스트 여부',
    example: true
  })
  isHot: boolean;

  @ApiProperty({
    description: 'Is new quest / 신규 퀘스트 여부',
    example: false
  })
  isNew: boolean;

  @ApiProperty({
    description: 'Quest rewards / 퀘스트 보상 목록',
    type: [QuestRewardUserResponseDto]
  })
  rewards: QuestRewardUserResponseDto[];

  @ApiPropertyOptional({
    description: 'Current user quest status / 현재 유저의 퀘스트 상태',
    enum: UserQuestStatus,
    nullable: true,
    example: UserQuestStatus.IN_PROGRESS
  })
  status: UserQuestStatus | null;

  @ApiPropertyOptional({
    description: 'Current progress count / 현재 진행 횟수',
    nullable: true,
    example: 3
  })
  currentCount: number | null;

  @ApiPropertyOptional({
    description: 'Target count / 목표 횟수',
    nullable: true,
    example: 10
  })
  targetCount: number | null;

  @ApiPropertyOptional({
    description: 'Current progress amount / 현재 진행 금액',
    nullable: true,
    example: 50.5
  })
  currentAmount: number | null;

  @ApiPropertyOptional({
    description: 'Target amount / 목표 금액',
    nullable: true,
    example: 100.0
  })
  targetAmount: number | null;

  @ApiProperty({
    description: 'Eligibility to participate / 참여 자격 여부',
    example: true
  })
  isEligible: boolean;
}
