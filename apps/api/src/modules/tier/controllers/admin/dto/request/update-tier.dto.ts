import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTierDto {
    @ApiProperty({ description: 'Tier priority / 티어 우선순위', required: false, example: 2 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    priority?: number;

    @ApiProperty({ description: 'Tier code / 티어 코드', required: false, example: 'SILVER' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ description: 'Requirement USD / 승급 조건 금액', required: false, example: 5000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    requirementUsd?: number;

    @ApiProperty({ description: 'Level up bonus / 승급 보너스', required: false, example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    levelUpBonus?: number;

    @ApiProperty({ description: 'Comp rate / 콤프 적립율', required: false, example: 0.6 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    compRate?: number;

    @ApiProperty({ description: 'Benefits / 혜택', required: false })
    @IsOptional()
    benefits?: any;

    @ApiProperty({ description: 'Display name / 표시 이름', required: false, example: 'Silver Tier' })
    @IsOptional()
    @IsString()
    displayName?: string;
}
