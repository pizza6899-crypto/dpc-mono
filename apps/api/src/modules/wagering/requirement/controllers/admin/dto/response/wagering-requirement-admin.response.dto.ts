import type { ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementAdminResponseDto {
    @ApiProperty({ description: 'ID / 식별자', example: '123456789' })
    id: string;

    @ApiProperty({ description: 'User ID / 유저 ID', example: '987654321' })
    userId: string;

    @ApiProperty({ description: 'Currency / 통화' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Source Type / 생성 소스 (DEPOSIT, PROMOTION_BONUS, TIER_BONUS)' })
    sourceType: WageringSourceType;

    @ApiProperty({ description: 'Principal Amount / 원금 (배수 계산의 기준액)', example: '10000' })
    principalAmount: string;

    @ApiProperty({ description: 'Multiplier / 롤링 배수', example: '10' })
    multiplier: string;

    @ApiProperty({ description: 'Required Amount / 총 목표 롤링 금액', example: '100000' })
    requiredAmount: string;

    @ApiProperty({ description: 'Fulfilled Amount / 현재까지 달성액', example: '50000' })
    fulfilledAmount: string;

    @ApiProperty({ description: 'Remaining Amount / 남은 목표액', example: '50000' })
    remainingAmount: string;

    @ApiProperty({ description: 'Locked Amount / 묶여있는 총 금액 (원금 + 보너스)', example: '12000' })
    lockedAmount: string;

    @ApiProperty({ description: 'Max Cash Conversion / 최대 현금 전환 가능액', nullable: true })
    maxCashConversion: string | null;

    @ApiProperty({ description: 'Converted Amount / 실제 정산 전환액', nullable: true })
    convertedAmount: string | null;

    @ApiProperty({ description: 'Is Paused / 일시 정지 여부' })
    isPaused: boolean;

    @ApiProperty({ description: 'Is Auto Cancelable / 오링 시 자동 취소 허용 여부' })
    isAutoCancelable: boolean;

    @ApiProperty({ description: 'Auto Cancel Threshold / 자동 취소 기준 잔액', nullable: true })
    autoCancelThreshold: string | null;

    @ApiProperty({ description: 'Status / 상태' })
    status: WageringStatus;

    @ApiProperty({ description: 'Priority / 반영 우선순위' })
    priority: number;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At / 최종 수정일' })
    updatedAt: Date;

    @ApiProperty({ description: 'Expires At / 만료 예정일', nullable: true })
    expiresAt: Date | null;

    @ApiProperty({ description: 'Last Contributed At / 마지막 기여일', nullable: true })
    lastContributedAt: Date | null;

    @ApiProperty({ description: 'Completed At / 달성 완료일', nullable: true })
    completedAt: Date | null;

    @ApiProperty({ description: 'Cancelled At / 취소일', nullable: true })
    cancelledAt: Date | null;

    @ApiProperty({ description: 'Cancellation Note / 취소 비고', nullable: true })
    cancellationNote: string | null;

    @ApiProperty({ description: 'Cancellation Reason Type / 취소 사유 코드', nullable: true })
    cancellationReasonType: string | null;

    @ApiProperty({ description: 'Cancelled By / 취소 수행자 ID (SYSTEM 또는 Admin ID)', nullable: true })
    cancelledBy: string | null;

    @ApiProperty({ description: 'Balance At Cancellation / 취소 당시 잔액', nullable: true })
    balanceAtCancellation: string | null;

    @ApiProperty({ description: 'Forfeited Amount / 몰수된 보너스 금액', nullable: true })
    forfeitedAmount: string | null;

    @ApiProperty({ description: 'Deposit Detail ID / 입금 상세 ID', nullable: true })
    depositDetailId: string | null;

    @ApiProperty({ description: 'User Promotion ID / 유저 프로모션참여 ID', nullable: true })
    userPromotionId: string | null;
}
