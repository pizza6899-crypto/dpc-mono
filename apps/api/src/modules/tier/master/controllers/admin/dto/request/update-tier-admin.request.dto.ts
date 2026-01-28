import { ApiProperty } from '@nestjs/swagger';
import { Language, TierEvaluationCycle } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TierTranslationRequestDto {
    @ApiProperty({ enum: Language })
    @IsEnum(Language)
    language: Language;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    description?: string | null;
}

export class UpdateTierAdminRequestDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    requirementUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    requirementDepositUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maintenanceRollingUsd?: number;

    @ApiProperty({ enum: TierEvaluationCycle, required: false })
    @IsOptional()
    @IsEnum(TierEvaluationCycle)
    evaluationCycle?: TierEvaluationCycle;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    levelUpBonusUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    levelUpBonusWageringMultiplier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    compRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    lossbackRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    rakebackRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    reloadBonusRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    dailyWithdrawalLimitUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isWithdrawalUnlimited?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    hasDedicatedManager?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isVIPEventEligible?: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    imageUrl?: string | null;

    @ApiProperty({ type: [TierTranslationRequestDto], required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TierTranslationRequestDto)
    translations?: TierTranslationRequestDto[];
}
