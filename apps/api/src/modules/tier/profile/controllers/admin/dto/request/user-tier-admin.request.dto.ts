import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { UserTierStatus } from '@prisma/client';

export class UpdateUserTierCustomRequestDto {
    @ApiProperty({ nullable: true, required: false, description: 'Custom comp rate override / 커스텀 컴프 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customCompRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom lossback rate override / 커스텀 손실 캐시백 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customLossbackRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom rakeback rate override / 커스텀 롤링 레이크백 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customRakebackRate?: number;

    @ApiProperty({ nullable: true, required: false, description: 'Custom reload bonus rate override / 커스텀 리로드 보너스 요율 오버라이드' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customReloadBonusRate?: number;

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

    @ApiProperty({ nullable: true, required: false, description: 'Custom VIP event eligibility / 커스텀 VIP 이벤트 대상 여부' })
    @IsOptional()
    @IsBoolean()
    isCustomVipEventEligible?: boolean;

    @ApiProperty({ nullable: true, required: false, description: 'Admin note for this specific user / 해당 유저에 대한 관리자 메모' })
    @IsOptional()
    @IsString()
    note?: string;
}

export class ForceUpdateTierRequestDto {
    @ApiProperty({ description: 'Target tier ID to force update / 강제 변경할 대상 티어 ID' })
    @IsString()
    targetTierId: string;

    @ApiProperty({ description: 'Reason for manual tier update / 수동 티어 변경 사유' })
    @IsString()
    reason: string;
}

type UserTierSortFields = 'userId' | 'lastTierChangedAt';

export class ListUserTiersQueryDto extends createPaginationQueryDto<UserTierSortFields>(
    {
        defaultLimit: 20,
        maxLimit: 100,
        defaultSortBy: 'userId',
        defaultSortOrder: 'asc',
    },
    ['userId', 'lastTierChangedAt'],
) {
    @ApiProperty({ required: false, enum: UserTierStatus, description: 'Filter by user tier status / 유저 티어 상태 필터' })
    @IsOptional()
    @IsEnum(UserTierStatus)
    status?: UserTierStatus;

    @ApiProperty({ required: false, description: 'Filter by specific tier ID / 특정 티어 ID 필터' })
    @IsOptional()
    @IsString()
    tierId?: string;

    @ApiProperty({ required: false, description: 'Search by Email or User ID / 이메일 또는 유저 ID로 검색' })
    @IsOptional()
    @IsString()
    search?: string;
}
