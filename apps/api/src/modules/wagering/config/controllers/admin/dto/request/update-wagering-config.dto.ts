import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsBoolean, IsObject, Min, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWageringCurrencySettingDto {
    @ApiPropertyOptional({ description: 'Cancellation threshold amount / 오링 기준액', example: 500 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cancellationThreshold?: number;

    @ApiPropertyOptional({ description: 'Minimum bet amount for contribution / 기여 인정 최소 베팅액', example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minBetAmount?: number;

    @ApiPropertyOptional({ description: 'Maximum bet amount for contribution (Capping) / 기여 인정 최대 한도액 (0이면 무제한)', example: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxBetAmount?: number;
}

export class UpdateWageringConfigDto {
    @ApiPropertyOptional({ description: 'Default bonus expiry days / 기본 보너스 만료일', example: 30 })
    @IsOptional()
    @IsInt()
    @Min(1)
    defaultBonusExpiryDays?: number;

    @ApiPropertyOptional({
        description: 'Currency specific settings / 통화별 상세 설정',
        additionalProperties: { $ref: '#/components/schemas/UpdateWageringCurrencySettingDto' },
        example: {
            KRW: { cancellationThreshold: 500, minBetAmount: 100, maxBetAmount: 0 },
            USD: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 }
        }
    })
    @IsOptional()
    @IsObject()
    currencySettings?: Record<string, UpdateWageringCurrencySettingDto>;

    @ApiPropertyOptional({ description: 'Enable wagering check on withdrawal / 출금 시 롤링 체크 여부', example: true })
    @IsOptional()
    @IsBoolean()
    isWageringCheckEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Enable auto cancellation / 오링 시 자동 취소 여부', example: true })
    @IsOptional()
    @IsBoolean()
    isAutoCancellationEnabled?: boolean;
}
