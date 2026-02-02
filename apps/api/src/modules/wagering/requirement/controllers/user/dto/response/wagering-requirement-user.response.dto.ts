import type { ExchangeCurrencyCode, WageringStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementUserResponseDto {
    @ApiProperty({ description: 'Requirement ID (Sqid) / 요구사항 ID (난독화됨)' })
    id: string;

    @ApiProperty({ description: 'Currency / 통화' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Principal Amount / 원금 (보너스 지급의 기준이 된 금액)', example: '10000' })
    principalAmount: string;

    @ApiProperty({ description: 'Wagering Multiplier / 롤링 배수', example: '10' })
    multiplier: number;

    @ApiProperty({ description: 'Required Amount / 총 요구 롤링 금액', example: '100000' })
    requiredAmount: string;

    @ApiProperty({ description: 'Fulfilled Amount / 현재까지 달성한 금액', example: '50000' })
    fulfilledAmount: string;

    @ApiProperty({ description: 'Remaining Amount / 남은 롤링 금액', example: '50000' })
    remainingAmount: string;

    @ApiProperty({ description: 'Progress Rate (0-100) / 달성률', example: 50 })
    progressRate: number;

    @ApiProperty({ description: 'Status / 상태' })
    status: WageringStatus;

    @ApiProperty({ description: 'Expires At / 만료 예정일', nullable: true })
    expiresAt: Date | null;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
