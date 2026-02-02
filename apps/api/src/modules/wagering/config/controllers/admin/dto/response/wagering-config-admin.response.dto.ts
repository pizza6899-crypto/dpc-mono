import { ApiProperty } from '@nestjs/swagger';

export class WageringCurrencySettingResponseDto {
    @ApiProperty({ description: 'Cancellation threshold amount / 오링 기준액', example: '500' })
    cancellationThreshold: string;

    @ApiProperty({ description: 'Minimum bet amount for contribution / 기여 인정 최소 베팅액', example: '100' })
    minBetAmount: string;

    @ApiProperty({ description: 'Maximum bet amount for contribution (Capping) / 기여 인정 최대 한도액', example: '0' })
    maxBetAmount: string;
}

export class WageringConfigAdminResponseDto {
    @ApiProperty({ description: 'Config ID (Always 1) / 설정 ID (항상 1)', example: '1' })
    id: string;

    @ApiProperty({ description: 'Default bonus expiry days / 기본 보너스 만료일', example: 30 })
    defaultBonusExpiryDays: number;

    @ApiProperty({
        description: 'Currency specific settings / 통화별 상세 설정',
        additionalProperties: { $ref: '#/components/schemas/WageringCurrencySettingResponseDto' },
        example: {
            KRW: { cancellationThreshold: '500', minBetAmount: '100', maxBetAmount: '0' },
            USD: { cancellationThreshold: '0.5', minBetAmount: '0.1', maxBetAmount: '0' }
        }
    })
    currencySettings: Record<string, WageringCurrencySettingResponseDto>;

    @ApiProperty({ description: 'Enable wagering check on withdrawal / 출금 시 롤링 체크 여부', example: true })
    isWageringCheckEnabled: boolean;

    @ApiProperty({ description: 'Enable auto cancellation / 오링 시 자동 취소 여부', example: true })
    isAutoCancellationEnabled: boolean;

    @ApiProperty({ description: 'Last updated at / 최종 수정일' })
    updatedAt: Date;

    @ApiProperty({ description: 'Last updated by admin ID / 최종 수정자 ID', nullable: true })
    updatedBy: string | null;
}
