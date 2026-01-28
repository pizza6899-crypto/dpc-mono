import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetTierDistributionService } from '../../application/get-tier-distribution.service';
import { TierDistributionResponseDto } from './dto/tier-stats-admin.response.dto';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { Admin } from 'src/common/auth/decorators/roles.decorator';

@ApiTags('Admin Tier Stats')
@Controller('admin/tier-stats')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Admin()
export class TierStatsAdminController {
    constructor(
        private readonly getTierDistributionService: GetTierDistributionService,
    ) { }

    @Get('distribution')
    @ApiOperation({ summary: 'Get tier distribution / 티어별 유저 분포 조회' })
    @ApiOkResponse({
        type: [TierDistributionResponseDto],
        description: 'Successfully retrieved tier distribution / 티어별 분포 조회 성공'
    })
    async getTierDistribution(): Promise<TierDistributionResponseDto[]> {
        return this.getTierDistributionService.execute();
    }
}
