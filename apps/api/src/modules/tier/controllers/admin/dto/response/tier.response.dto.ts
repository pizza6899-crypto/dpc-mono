import { ApiProperty } from '@nestjs/swagger';
import { TierTranslationDto } from '../request/create-tier.dto';

export class TierResponseDto {
    @ApiProperty({ description: 'Tier ID / 티어 ID' })
    id: string; // BigInt to String

    @ApiProperty({ description: 'Priority / 우선순위' })
    priority: number;

    @ApiProperty({ description: 'Code / 코드' })
    code: string;

    @ApiProperty({ description: 'Requirement USD / 조건 금액 (문자열)' })
    requirementUsd: string;

    @ApiProperty({ description: 'Level Up Bonus / 승급 보너스 (USD)' })
    levelUpBonusUsd: string;

    @ApiProperty({ description: 'Comp Rate / 콤프율 (문자열)' })
    compRate: string;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At / 수정일' })
    updatedAt: Date;

    @ApiProperty({ description: 'Translations / 번역 정보', type: [TierTranslationDto] })
    translations: TierTranslationDto[];
}
