import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

import { GetUserTierService } from '../../application/get-user-tier.service';
import { UserTierResponseDto } from './dto/response/user-tier.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@ApiTags('User Tier')
@Controller('user/my-tier')
@ApiStandardErrors()
export class TierUserController {
    constructor(
        private readonly getUserTierService: GetUserTierService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'USER_TIER_VIEW',
        extractMetadata: (_, __, result) => ({
            tierCode: result?.tierCode,
        }),
    })
    @ApiOperation({ summary: 'Get my tier info / 내 티어 정보 조회' })
    @ApiStandardResponse(UserTierResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved user tier info / 사용자 티어 정보 조회 성공',
    })
    async getMyTier(@CurrentUser() user: CurrentUserWithSession): Promise<UserTierResponseDto> {
        const userTier = await this.getUserTierService.execute(user.id);
        if (!userTier) {
            // If user has no tier, throwing error might not be best UX. 
            // Maybe return empty or default?
            // For now, consistent with Admin controller: Error or NotFound.
            // But usually every user should have a tier (starting tier).
            const { NotFoundException } = await import('@nestjs/common');
            throw new NotFoundException('User tier not found');
        }
        return {
            id: this.sqidsService.encode(userTier.id!, SqidsPrefix.USER_TIER),
            tierCode: userTier.tier?.code ?? 'UNKNOWN',
            totalRollingUsd: userTier.cumulativeRollingUsd.toString(),
            highestPromotedPriority: userTier.highestPromotedPriority,
            isManualLock: userTier.isManualLock,
            lastPromotedAt: userTier.lastPromotedAt,
            tierRequirementUsd: userTier.tier?.requirementUsd.toString(),
            tierTranslations: userTier.tier?.translations.map(t => ({
                language: t.language as any,
                name: t.name,
            })),
        };
    }
}
