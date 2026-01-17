import { IsNumber, IsString, IsOptional, Min, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from 'src/generated/prisma';

export class TierTranslationDto {
    @ApiProperty({ enum: Language, description: 'Language code / 언어 코드', example: Language.EN })
    @IsEnum(Language)
    language: Language;

    @ApiProperty({ description: 'Tier name / 티어 이름', example: 'Bronze' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateTierDto {
    @ApiProperty({ description: 'Tier priority (higher value = higher tier) / 티어 우선순위 (높을수록 상위 티어)', example: 1 })
    @IsNumber()
    @Min(0)
    priority: number;

    @ApiProperty({ description: 'Unique tier code / 티어 코드 (고유)', example: 'BRONZE' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Rolling requirement in USD / 승급 필요 롤링 금액 (USD)', example: 1000 })
    @IsNumber()
    @Min(0)
    requirementUsd: number;

    @ApiProperty({ description: 'Level up bonus amount / 승급 보너스 금액', required: false, example: 50 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    levelUpBonusUsd?: number;

    @ApiProperty({ description: 'Comp point rate / 콤프 적립 비율', required: false, example: 0.5 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    compRate?: number;
}
