import { ApiProperty } from '@nestjs/swagger';
import { UserTier } from '../../../../domain';
import { TierTranslationDto } from '../../../admin/dto/request/create-tier.dto';

export class UserTierResponseDto {
    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

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

    // Joined Tier Info
    @ApiProperty({ description: 'Current Tier Requirement / 현재 티어 유지/달성 조건금액', required: false })
    tierRequirementUsd?: string;

    @ApiProperty({ description: 'Tier Translations / 티어 번역 정보', required: false, type: [TierTranslationDto] })
    tierTranslations?: TierTranslationDto[];

    constructor(userTier: UserTier) {
        this.userId = userTier.userId.toString();
        this.tierCode = userTier.tier?.code ?? 'UNKNOWN';
        this.totalRollingUsd = userTier.totalRollingUsd.toString();
        this.highestPromotedPriority = userTier.highestPromotedPriority;
        this.isManualLock = userTier.isManualLock;
        this.lastPromotedAt = userTier.lastPromotedAt;

        if (userTier.tier) {
            this.tierRequirementUsd = userTier.tier.requirementUsd.toString();
            this.tierTranslations = userTier.tier.translations.map(t => ({
                language: t.language as any,
                name: t.name
            }));
        }
    }
}
