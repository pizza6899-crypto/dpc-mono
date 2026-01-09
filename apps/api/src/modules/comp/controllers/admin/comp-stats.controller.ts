import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserRoleType } from '@repo/database';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';

@ApiTags('Admin Comp Stats')
@Controller('admin/comp/stats')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CompStatsController {
    constructor() { }

    @Get('overview')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get platform comp overview' })
    async getOverview(@Query('currency') currency?: ExchangeCurrencyCode) {
        return {
            totalEarned: '10000.00',
            totalUsed: '2000.00',
            conversionRate: '20.0%'
        };
    }

    @Get('daily')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get daily comp trends' })
    async getDailyStats(@Query('currency') currency?: ExchangeCurrencyCode) {
        return [
            { date: "2024-01-01", earned: '500.00', used: '100.00' },
            { date: "2024-01-02", earned: '600.00', used: '50.00' }
        ];
    }

    @Get('top-earners')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get top comp earners' })
    async getTopEarners(@Query('currency') currency?: ExchangeCurrencyCode) {
        return [
            { userId: 1, totalEarned: '5000.00' },
            { userId: 2, totalEarned: '3000.00' }
        ];
    }
}
