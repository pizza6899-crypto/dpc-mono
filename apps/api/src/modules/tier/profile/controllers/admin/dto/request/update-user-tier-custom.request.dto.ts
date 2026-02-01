import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateUserTierCustomRequestDto {
    @ApiProperty({ nullable: true, required: false, description: 'Custom comp rate override / 커스텀 컴프 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customCompRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom weekly lossback rate override / 커스텀 주간 손실 캐시백 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customWeeklyLossbackRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom monthly lossback rate override / 커스텀 월간 손실 캐시백 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customMonthlyLossbackRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom daily withdrawal limit (USD) / 커스텀 일일 출금 한도 (USD)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customWithdrawalLimitUsd?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom unlimited withdrawal flag / 커스텀 무제한 출금 여부' })
    @IsOptional()
    @IsBoolean()
    isCustomWithdrawalUnlimited?: boolean;

    @ApiProperty({ nullable: true, required: false, description: 'Custom dedicated manager flag / 커스텀 전담 매니저 제공 여부' })
    @IsOptional()
    @IsBoolean()
    isCustomDedicatedManager?: boolean;

    @ApiProperty({ nullable: true, required: false, description: 'Admin note for this specific user / 해당 유저에 대한 관리자 메모' })
    @IsOptional()
    @IsString()
    note?: string;
}
