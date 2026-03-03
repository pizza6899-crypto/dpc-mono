import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export class TierPublicRequirementDto {
  @ApiProperty({ description: 'Required EXP for upgrade' })
  @IsString()
  upgradeExp: string;
}

export class TierPublicCurrencyBenefitDto {
  @ApiProperty({ enum: ExchangeCurrencyCode })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Upgrade bonus amount' })
  @IsString()
  upgradeBonus: string;

  @ApiProperty({ description: 'Birthday bonus amount' })
  @IsString()
  birthdayBonus: string;
}

export class TierPublicBenefitsDto {
  @ApiProperty()
  @IsString()
  comp: string;

  @ApiProperty()
  @IsString()
  weeklyLossback: string;

  @ApiProperty()
  @IsString()
  monthlyLossback: string;

  @ApiProperty()
  @IsString()
  upgradeBonusWager: string;

  @ApiProperty({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  rewardExpiryDays: number | null;

  @ApiProperty({ type: [TierPublicCurrencyBenefitDto] })
  @Type(() => TierPublicCurrencyBenefitDto)
  currencyBenefits: TierPublicCurrencyBenefitDto[];
}

export class TierPublicLimitsDto {
  @ApiProperty()
  @IsString()
  dailyWithdrawal: string;

  @ApiProperty()
  @IsString()
  weeklyWithdrawal: string;

  @ApiProperty()
  @IsString()
  monthlyWithdrawal: string;

  @ApiProperty()
  @IsBoolean()
  isUnlimited: boolean;
}

export class TierPublicResponseDto {
  @ApiProperty({ description: 'Encoded Tier ID' })
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Localized tier name' })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Localized tier description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  imageUrl: string | null;

  @ApiProperty()
  @Type(() => TierPublicRequirementDto)
  requirements: TierPublicRequirementDto;

  @ApiProperty()
  @Type(() => TierPublicBenefitsDto)
  benefits: TierPublicBenefitsDto;

  @ApiProperty()
  @Type(() => TierPublicLimitsDto)
  limits: TierPublicLimitsDto;

  @ApiProperty({ type: Number })
  @IsNumber()
  level: number;
}
