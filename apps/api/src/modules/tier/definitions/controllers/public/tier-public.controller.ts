import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Language, Prisma } from '@prisma/client';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { TierService } from '../../application/tier.service';
import { TierPublicResponseDto } from './dto/tier-public.response.dto';
import { TierPublicQueryDto } from './dto/tier-public.query.dto';
import { Tier } from '../../domain/tier.entity';

import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@Controller('public/tiers')
@ApiTags('Public Tiers')
@ApiStandardErrors()
export class TierPublicController {
    constructor(
        private readonly tierService: TierService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'List all tiers (Public) / 전체 티어 정보 조회',
        description: 'Returns a list of all tiers translated into the requested language. Fallback to English if no language is specified. / 요청한 언어로 번역된 전체 티어 목록을 반환합니다. 언어가 지정되지 않으면 기본값을 사용합니다.',
    })
    @ApiStandardResponse(TierPublicResponseDto, { isArray: true })
    async getTiers(
        @Query() query: TierPublicQueryDto,
    ): Promise<TierPublicResponseDto[]> {
        const targetLang = query.lang || Language.EN;
        let tiers = await this.tierService.findAll();

        // 1. Filter by Code
        if (query.code) {
            tiers = tiers.filter(t => t.code.toUpperCase() === query.code!.toUpperCase());
        }

        // 2. Filter by Encoded ID
        if (query.id) {
            const decodedId = this.sqidsService.decode(query.id, SqidsPrefix.TIER);
            if (decodedId) {
                tiers = tiers.filter(t => t.id === decodedId);
            } else {
                return []; // Invalid ID provided
            }
        }

        // Level 순으로 정렬
        const sortedTiers = tiers.sort((a, b) => a.level - b.level);

        return sortedTiers.map(tier => this.mapToResponseDto(tier, targetLang));
    }

    private mapToResponseDto(tier: Tier, lang: Language): TierPublicResponseDto {
        const translation = tier.translations.find(t => t.language === lang)
            || tier.translations.find(t => t.language === Language.EN)
            || tier.translations[0];

        // Decimal 포맷팅 유틸리티
        const formatUsd = (v: Prisma.Decimal) => v.toFixed(2);
        const formatRate = (v: Prisma.Decimal) => v.toFixed(4);

        return {
            id: this.sqidsService.encode(tier.id, SqidsPrefix.TIER),
            code: tier.code,
            level: tier.level,
            name: translation?.name ?? tier.code,
            description: translation?.description ?? null,
            imageUrl: tier.imageUrl,
            requirements: {
                upgradeRolling: formatUsd(tier.upgradeRollingRequiredUsd),
                upgradeDeposit: formatUsd(tier.upgradeDepositRequiredUsd),
                maintenance: formatUsd(tier.maintainRollingRequiredUsd),
            },
            benefits: {
                comp: formatRate(tier.compRate),
                weeklyLossback: formatRate(tier.weeklyLossbackRate),
                monthlyLossback: formatRate(tier.monthlyLossbackRate),
                upgradeBonus: formatUsd(tier.upgradeBonusUsd),
                upgradeBonusWager: tier.upgradeBonusWageringMultiplier.toFixed(0),
                rewardExpiryDays: tier.rewardExpiryDays,
            },
            limits: {
                dailyWithdrawal: formatUsd(tier.dailyWithdrawalLimitUsd),
                isUnlimited: tier.isWithdrawalUnlimited,
            },
        };
    }
}
