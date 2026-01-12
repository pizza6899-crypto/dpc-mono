import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FindUserStatsService } from '../../application/find-user-stats.service';
import { FindStatsRequestDto } from '../user/dto/request/find-stats.request.dto';
import { AdminStatResponseDto } from './dto/response/admin-stat.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AnalyticsInvalidDateRangeException } from '../../domain';

@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AnalyticsAdminController {
    constructor(private readonly findStatsService: FindUserStatsService) { }

    @Get('users/:userId/stats')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user stats (Admin)',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ANALYTICS',
        action: 'USER_STATS_VIEW',
        extractMetadata: (req) => ({
            userId: req.params.userId,
        }),
    })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiStandardResponse(AdminStatResponseDto, {
        status: 200,
        description: 'Successfully retrieved user stats',
        isArray: true,
    })
    async findUserStats(
        @Param('userId') userId: string,
        @Query() dto: FindStatsRequestDto,
    ): Promise<AdminStatResponseDto[]> {
        const startAt = dto.startAt
            ? new Date(dto.startAt)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endAt = dto.endAt ? new Date(dto.endAt) : new Date();

        if (startAt > endAt) {
            throw new AnalyticsInvalidDateRangeException(startAt, endAt);
        }

        const stats = await this.findStatsService.findHourlyStats(
            BigInt(userId),
            startAt,
            endAt,
            dto.currency,
        );

        return stats.map(stat => ({
            userId: stat.userId.toString(),
            currency: stat.currency,
            date: stat.date,
            totalDeposit: stat.totalDeposit.toNumber(),
            totalWithdraw: stat.totalWithdraw.toNumber(),
            depositCount: stat.depositCount,
            withdrawCount: stat.withdrawCount,
            totalBet: stat.totalBet.toNumber(),
            totalWin: stat.totalWin.toNumber(),
            netWin: stat.netWin.toNumber(),
            ggr: stat.ggr.toNumber(),
            totalGameCount: stat.totalGameCount,
            totalBonusGiven: stat.totalBonusGiven.toNumber(),
            totalBonusUsed: stat.totalBonusUsed.toNumber(),
            totalBonusConverted: stat.totalBonusConverted.toNumber(),
            totalCompEarned: stat.totalCompEarned.toNumber(),
            totalCompConverted: stat.totalCompConverted.toNumber(),
            totalCompDeducted: stat.totalCompDeducted.toNumber(),
            startBalance: stat.startBalance.toNumber(),
            endBalance: stat.endBalance.toNumber(),
        }));
    }
}
