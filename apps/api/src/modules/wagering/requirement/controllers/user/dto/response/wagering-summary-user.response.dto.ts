import { ApiProperty } from '@nestjs/swagger';

export class WageringSummaryUserResponseDto {
    @ApiProperty({ description: 'Total number of active requirements / 진행 중인 총 롤링 조건 수', example: 2 })
    activeCount: number;

    @ApiProperty({ description: 'Total remaining wagering amount / 총 남은 롤링 금액 (통화별 합산은 UI에서 처리 권장, 여기서는 대표 통화 또는 첫 번째 활성 통화 기준)', example: '50000' })
    totalRemainingAmount: string;

    @ApiProperty({ description: 'Is withdrawal restricted / 현재 출금 제한 여부', example: true })
    isWithdrawalRestricted: boolean;

    @ApiProperty({ description: 'Last contribution date / 마지막 기여 발생일', nullable: true })
    lastContributedAt: Date | null;
}
