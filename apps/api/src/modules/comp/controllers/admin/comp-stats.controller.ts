import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRoleType } from '@repo/database';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CompStatsQueryDto } from './dto/request/comp-stats-query.dto';

import { FindCompOverviewService } from '../../application/find-comp-overview.service';
import { FindCompDailyStatsService } from '../../application/find-comp-daily-stats.service';
import { FindCompTopEarnersService } from '../../application/find-comp-top-earners.service';

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
    @ApiOperation({ summary: 'Get platform comp overview' })
    async getOverview(@Query() query: CompStatsQueryDto) {
        return this.findCompOverviewService.execute({
            currency: query.currency,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
    }

    @Get('daily')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get daily comp trends' })
    async getDailyStats(@Query() query: CompStatsQueryDto) {
        return this.findCompDailyStatsService.execute({
            currency: query.currency,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
    }

    @Get('top-earners')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get top comp earners' })
    async getTopEarners(@Query() query: CompStatsQueryDto) {
        return this.findCompTopEarnersService.execute({
            currency: query.currency,
            limit: 10,
        });
    }
}
