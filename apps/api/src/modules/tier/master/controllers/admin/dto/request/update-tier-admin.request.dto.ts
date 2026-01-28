import { ApiProperty } from '@nestjs/swagger';
import { Language, TierEvaluationCycle } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TierTranslationRequestDto {
    @ApiProperty({ enum: Language })
    @IsEnum(Language)
    language: Language;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ type: String, required: false, nullable: true })
    @IsOptional()
    @IsString()
    description?: string | null;
}

export class UpdateTierAdminRequestDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    requirementUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    requirementDepositUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maintenanceRollingUsd?: number;

    @ApiProperty({ enum: TierEvaluationCycle, required: false })
    @IsOptional()
    @IsEnum(TierEvaluationCycle)
    evaluationCycle?: TierEvaluationCycle;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    levelUpBonusUsd?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    levelUpBonusWageringMultiplier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    compRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    lossbackRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    rakebackRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    reloadBonusRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
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

    @ApiProperty({ required: false, description: 'File ID for tier image (e.g., f_abc123)', nullable: true })
    @IsOptional()
    @IsString()
    imageFileId?: string | null;

    @ApiProperty({ type: [TierTranslationRequestDto], required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TierTranslationRequestDto)
    translations?: TierTranslationRequestDto[];
}
