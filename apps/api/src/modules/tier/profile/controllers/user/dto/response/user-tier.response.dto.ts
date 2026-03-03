import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';

export class NextTierProgressDto {
  @ApiProperty({ description: 'Target tier ID / 대상 티어 ID' })
  id: string;

  @ApiProperty({ description: 'Target tier name / 대상 티어 이름' })
  name: string;

  @ApiProperty({
    type: String,
    description: 'Target tier image URL / 대상 티어 이미지 URL',
    required: false,
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Required XP for upgrade / 승급에 필요한 XP',
  })
  requiredExp: string;

  @ApiProperty({
    description: 'Current accumulated XP / 현재 누적 XP',
  })
  currentExp: string;

  @ApiProperty({
    description: 'Remaining XP needed / 남은 XP',
  })
  remainingExp: string;

  @ApiProperty({
    description: 'Progress percentage (0-100) / 승급 진행률 (%)',
  })
  progressPercent: number;
}

export class EffectiveBenefitsDto {
  @ApiProperty({ description: 'Comp rate / 컴프 요율' })
  compRate: string;

  @ApiProperty({ description: 'Weekly lossback rate / 주간 손실 캐시백 요율' })
  weeklyLossbackRate: string;

  @ApiProperty({ description: 'Monthly lossback rate / 월간 손실 캐시백 요율' })
  monthlyLossbackRate: string;

  @ApiProperty({
    description: 'Daily withdrawal limit (USD) / 일일 출금 한도 (USD)',
  })
  dailyWithdrawalLimitUsd: string;

  @ApiProperty({
    description: 'Weekly withdrawal limit (USD) / 주간 출금 한도 (USD)',
  })
  weeklyWithdrawalLimitUsd: string;

  @ApiProperty({
    description: 'Monthly withdrawal limit (USD) / 월간 출금 한도 (USD)',
  })
  monthlyWithdrawalLimitUsd: string;

  @ApiProperty({
    description: 'Whether withdrawal is unlimited / 무제한 출금 여부',
  })
  isWithdrawalUnlimited: boolean;

  @ApiProperty({
    description: 'Whether has a dedicated manager / 전담 매니저 제공 여부',
  })
  hasDedicatedManager: boolean;
}

export class UserTierResponseDto {
  @ApiProperty({
    description: 'User tier status record ID / 유저 티어 상태 레코드 ID',
  })
  id: string;

  @ApiProperty({ description: 'Definitions tier ID / 정의 티어 ID' })
  tierId: string;

  @ApiProperty({ description: 'Tier Code / 티어 코드' })
  code: string;

  @ApiProperty({ description: 'Tier Name / 티어 이름' })
  name: string;

  @ApiProperty({ description: 'Tier Level / 티어 레벨' })
  level: number;

  @ApiProperty({
    type: String,
    description: 'Tier Image URL / 티어 이미지 URL',
    required: false,
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    enum: UserTierStatus,
    description: 'User tier status / 유저 티어 상태',
  })
  status: UserTierStatus;

  @ApiProperty({
    description: 'Date when the tier was last changed / 마지막 티어 변경 일시',
  })
  lastChangedAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Date for the next evaluation / 다음 심사 예정 일시',
    required: false,
    nullable: true,
  })
  nextEvaluationAt: Date | null;

  @ApiProperty({
    description:
      'Effective benefits applied to the user / 유저에게 적용되는 실제 혜택',
  })
  benefits: EffectiveBenefitsDto;

  @ApiProperty({
    type: () => NextTierProgressDto,
    description: 'Progress towards the next tier / 다음 티어 승급 진행률',
    required: false,
    nullable: true,
  })
  nextTierProgress: NextTierProgressDto | null;
}
