import { ApiProperty } from '@nestjs/swagger';

export class EffectiveBenefitsAdminResponseDto {
    @ApiProperty({ description: 'Comp rate / 컴프 요율' })
    compRate: string;

    @ApiProperty({ description: 'Lossback rate / 손실 캐시백 요율' })
    lossbackRate: string;

    @ApiProperty({ description: 'Rakeback rate / 롤링 레이크백 요율' })
    rakebackRate: string;

    @ApiProperty({ description: 'Reload bonus rate / 리로드 보너스 요율' })
    reloadBonusRate: string;

    @ApiProperty({ description: 'Daily withdrawal limit (USD) / 일일 출금 한도 (USD)' })
    dailyWithdrawalLimitUsd: string;

    @ApiProperty({ description: 'Whether withdrawal is unlimited / 무제한 출금 여부' })
    isWithdrawalUnlimited: boolean;

    @ApiProperty({ description: 'Whether has a dedicated manager / 전담 매니저 제공 여부' })
    hasDedicatedManager: boolean;

    @ApiProperty({ description: 'Whether eligible for VIP events / VIP 이벤트 대상 여부' })
    isVIPEventEligible: boolean;
}
