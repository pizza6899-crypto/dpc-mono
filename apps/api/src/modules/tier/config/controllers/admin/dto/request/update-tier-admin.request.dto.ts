import { ApiProperty } from '@nestjs/swagger';
import { Language, TierEvaluationCycle } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
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
  level?: number;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Required XP for upgrade (BigInt as string)',
  })
  @IsOptional()
  @IsString()
  upgradeExpRequired?: string;

  @ApiProperty({ enum: TierEvaluationCycle, required: false })
  @IsOptional()
  @IsEnum(TierEvaluationCycle)
  evaluationCycle?: TierEvaluationCycle;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  upgradeBonusWageringMultiplier?: number;

  @ApiProperty({
    required: false,
    description: 'Bonus reward expiry days',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rewardExpiryDays?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyLossbackRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyLossbackRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyWithdrawalLimitUsd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyWithdrawalLimitUsd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyWithdrawalLimitUsd?: number;

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
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isManualOnly?: boolean;

  @ApiProperty({
    required: false,
    description: 'File ID for tier image (e.g., f_abc123)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  imageFileId?: string | null;

  @ApiProperty({ type: [TierTranslationRequestDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TierTranslationRequestDto)
  translations?: TierTranslationRequestDto[];
}
