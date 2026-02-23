import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsDate,
    IsObject,
    IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    ExchangeCurrencyCode,
    RewardItemType,
    RewardSourceType,
    WageringTargetType,
} from '@prisma/client';

export class GrantRewardRequestDto {
    @ApiProperty({ description: 'User ID / 사용자 ID (BigInt as String)' })
    @IsString()
    userId: string;

    @ApiProperty({
        enum: RewardSourceType,
        description: 'Reward Source Type / 보상 출처 타입',
    })
    @IsEnum(RewardSourceType)
    sourceType: RewardSourceType;

    @ApiPropertyOptional({ description: 'Source ID / 출처 ID (BigInt as String)' })
    @IsOptional()
    @IsString()
    sourceId?: string;

    @ApiProperty({
        enum: RewardItemType,
        description: 'Reward Item Type / 보상 아이템 타입',
    })
    @IsEnum(RewardItemType)
    rewardType: RewardItemType;

    @ApiProperty({
        enum: ExchangeCurrencyCode,
        description: 'Currency / 통화',
    })
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Amount / 보상 금액 (String)' })
    @IsNumberString({}, { message: 'amount must be a valid numeric string' })
    amount: string;

    @ApiPropertyOptional({
        enum: WageringTargetType,
        description: 'Wagering Target Type / 롤링 대상 타입',
    })
    @IsOptional()
    @IsEnum(WageringTargetType)
    wageringTargetType?: WageringTargetType;

    @ApiPropertyOptional({ description: 'Wagering Multiplier / 롤링 배수 (String)' })
    @IsOptional()
    @IsNumberString({}, { message: 'wageringMultiplier must be a valid numeric string' })
    wageringMultiplier?: string;

    @ApiPropertyOptional({ description: 'Wagering Expiry Days / 롤링 만료 일수' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    wageringExpiryDays?: number;

    @ApiPropertyOptional({ description: 'Max Cash Conversion / 최대 현금 전환액 (String)' })
    @IsOptional()
    @IsNumberString({}, { message: 'maxCashConversion must be a valid numeric string' })
    maxCashConversion?: string;

    @ApiPropertyOptional({ description: 'Is Forfeitable / 포기 가능 여부' })
    @IsOptional()
    @IsBoolean()
    isForfeitable?: boolean;

    @ApiPropertyOptional({ description: 'Expires At / 만료 일시' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiresAt?: Date;

    @ApiPropertyOptional({ description: 'Reward Metadata / 보상 메타데이터 객체' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Reason / 지급 사유' })
    @IsOptional()
    @IsString()
    reason?: string;
}
