import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FindUserStatsService } from '../../application/find-user-stats.service';
import { FindStatsRequestDto } from './dto/request/find-stats.request.dto';
import { UserHourlyStatResponseDto } from './dto/response/stat.response.dto';
import { AggregatedStatResponseDto } from './dto/response/aggregated-stat.response.dto';
import { CurrentUser, type CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AnalyticsInvalidParameterException, AnalyticsInvalidDateRangeException } from '../../domain';

@ApiTags('Analytics')
@Controller('user/analytics')
@ApiStandardErrors()
export class AnalyticsUserController {
    constructor(private readonly findStatsService: FindUserStatsService) { }

    @Get('stats/hourly')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get hourly user stats',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ANALYTICS',
        action: 'STATS_HOURLY_VIEW',
        extractMetadata: (user) => ({
            userId: user.id,
        }),
    })
    @ApiStandardResponse(UserHourlyStatResponseDto, {
        status: 200,
        description: 'Successfully retrieved hourly stats',
        isArray: true,
    })
    async findHourlyStats(
        @CurrentUser() user: CurrentUserWithSession,
        @Query() dto: FindStatsRequestDto,
    ): Promise<UserHourlyStatResponseDto[]> {
        const startAt = dto.startAt
            ? new Date(dto.startAt)
            : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default 24h
        const endAt = dto.endAt ? new Date(dto.endAt) : new Date();

        if (startAt > endAt) {
            throw new AnalyticsInvalidDateRangeException(startAt, endAt);
        }

        const stats = await this.findStatsService.findHourlyStats(
            BigInt(user.id),
            startAt,
            endAt,
            dto.currency,
        );

        return stats.map(stat => UserHourlyStatResponseDto.fromDomain(stat));
    }

    @Get('stats/aggregated')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get aggregated user stats',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ANALYTICS',
        action: 'STATS_AGGREGATED_VIEW',
        extractMetadata: (user) => ({
            userId: user.id,
        }),
    })
    @ApiStandardResponse(AggregatedStatResponseDto, {
        status: 200,
        description: 'Successfully retrieved aggregated stats',
    })
    async findAggregatedStats(
        @CurrentUser() user: CurrentUserWithSession,
        @Query() dto: FindStatsRequestDto,
    ): Promise<AggregatedStatResponseDto> {
        const startAt = dto.startAt
            ? new Date(dto.startAt)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endAt = dto.endAt ? new Date(dto.endAt) : new Date();

        if (startAt > endAt) {
            throw new AnalyticsInvalidDateRangeException(startAt, endAt);
        }

        if (!dto.currency) {
            throw new AnalyticsInvalidParameterException('Currency is required for aggregated stats');
        }

        const stat = await this.findStatsService.findAggregatedStats(
            BigInt(user.id),
            startAt,
            endAt,
            dto.currency,
        );

        return AggregatedStatResponseDto.fromAggregated(stat);
    }
}
