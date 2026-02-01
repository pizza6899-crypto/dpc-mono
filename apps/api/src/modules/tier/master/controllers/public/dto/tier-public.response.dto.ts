import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class TierPublicRequirementDto {
    @ApiProperty()
    @IsString()
    rolling: string;

    @ApiProperty()
    @IsString()
    deposit: string;

    @ApiProperty()
    @IsString()
    maintenance: string;
}

export class TierPublicBenefitsDto {
    @ApiProperty()
    @IsString()
    comp: string;

    @ApiProperty()
    @IsString()
    rakeback: string;

    @ApiProperty()
    @IsString()
    lossback: string;

    @ApiProperty()
    @IsString()
    reload: string;

    @ApiProperty()
    @IsString()
    levelUpBonus: string;

    @ApiProperty()
    @IsString()
    levelUpWager: string;
}

export class TierPublicLimitsDto {
    @ApiProperty()
    @IsString()
    dailyWithdrawal: string;

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

    @ApiProperty({ type: String, description: 'Localized tier description', nullable: true })
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
    rank: number;
}
