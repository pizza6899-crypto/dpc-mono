import { ApiProperty } from '@nestjs/swagger';

export class EffectiveBenefitsAdminResponseDto {
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
