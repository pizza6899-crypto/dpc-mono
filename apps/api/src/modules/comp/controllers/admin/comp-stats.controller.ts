import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRoleType } from '@repo/database';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CompStatsQueryDto } from './dto/request/comp-stats-query.dto';

import { FindCompOverviewService } from '../../application/find-comp-overview.service';
import { FindCompDailyStatsService } from '../../application/find-comp-daily-stats.service';
import { FindCompTopEarnersService } from '../../application/find-comp-top-earners.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { CompOverviewResponseDto } from './dto/response/comp-overview.response.dto';
import { CompDailyStatResponseDto } from './dto/response/comp-daily-stat.response.dto';
import { CompTopEarnerResponseDto } from './dto/response/comp-top-earner.response.dto';

@ApiTags('Admin Comp Stats')
@Controller('admin/comp/stats')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CompStatsController {
    constructor(
        private readonly findCompOverviewService: FindCompOverviewService,
        private readonly findCompDailyStatsService: FindCompDailyStatsService,
        private readonly findCompTopEarnersService: FindCompTopEarnersService,
    ) { }

    @Get('overview')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get platform comp overview',
        description: '플랫폼 전체의 콤프 적립 및 사용 현황 개요를 조회합니다.'
    })
    @ApiStandardResponse(CompOverviewResponseDto, {
        description: 'Successfully retrieved platform comp overview'
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'STATS_OVERVIEW_VIEW',
        extractMetadata: (_, args) => ({
            currency: args[0]?.currency,
        }),
    })
    async getOverview(@Query() query: CompStatsQueryDto): Promise<CompOverviewResponseDto> {
        return this.findCompOverviewService.execute({
            currency: query.currency,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
    }

    @Get('daily')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get daily comp trends',
        description: '날짜별 콤프 적립 및 사용 트렌드 목록을 조회합니다.'
    })
    @ApiStandardResponse(CompDailyStatResponseDto, {
        isArray: true,
        description: 'Successfully retrieved daily comp trends'
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'STATS_DAILY_VIEW',
        extractMetadata: (_, args) => ({
            currency: args[0]?.currency,
        }),
    })
    async getDailyStats(@Query() query: CompStatsQueryDto): Promise<CompDailyStatResponseDto[]> {
        return this.findCompDailyStatsService.execute({
            currency: query.currency,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
    }

    @Get('top-earners')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get top comp earners',
        description: '가장 많은 콤프 포인트를 획득한 상위 사용자 목록을 조회합니다.'
    })
    @ApiStandardResponse(CompTopEarnerResponseDto, {
        isArray: true,
        description: 'Successfully retrieved top comp earners'
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'STATS_TOP_EARNERS_VIEW',
        extractMetadata: (_, args) => ({
            currency: args[0]?.currency,
        }),
    })
    async getTopEarners(@Query() query: CompStatsQueryDto): Promise<CompTopEarnerResponseDto[]> {
        return this.findCompTopEarnersService.execute({
            currency: query.currency,
            limit: 10,
        });
    }
}
