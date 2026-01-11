import { ApiProperty } from '@nestjs/swagger';
import { TierTranslationDto } from '../../../admin/dto/request/create-tier.dto';

export class UserTierResponseDto {
    @ApiProperty({ description: 'User Tier Record ID (Sqid) / 사용자 티어 기록 고유 ID' })
    id: string;

    @ApiProperty({ description: 'Current Tier Code / 현재 티어 코드' })
    tierCode: string;

    @ApiProperty({ description: 'Total Rolling Amount (USD) / 총 누적 롤링 금액' })
    totalRollingUsd: string;

    @ApiProperty({ description: 'Highest Promoted Priority / 최고 도달 우선순위' })
    highestPromotedPriority: number;

    @ApiProperty({ description: 'Is Manual Lock / 수동 잠금 여부' })
    isManualLock: boolean;

    @ApiProperty({ description: 'Last Promoted At / 마지막 승급일' })
    lastPromotedAt: Date;

    @ApiProperty({ description: 'Current Tier Requirement / 현재 티어 유지/달성 조건금액', required: false })
    tierRequirementUsd?: string;

    @ApiProperty({ description: 'Tier Translations / 티어 번역 정보', required: false, type: [TierTranslationDto] })
    tierTranslations?: TierTranslationDto[];
}
