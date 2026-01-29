import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetTierDistributionService } from '../../application/get-tier-distribution.service';
import { ListEvaluationLogsService } from '../../application/list-evaluation-logs.service';
import { TierDistributionResponseDto } from './dto/tier-distribution.response.dto';
import { EvaluationLogResponseDto } from './dto/evaluation-log.response.dto';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { Admin } from 'src/common/auth/decorators/roles.decorator';

@ApiTags('Admin Tier Audit')
@Controller('admin/tier-audit')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Admin()
export class TierAuditAdminController {
    constructor(
        private readonly getTierDistributionService: GetTierDistributionService,
        private readonly listEvaluationLogsService: ListEvaluationLogsService,
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

    @Get('evaluation-logs')
    @ApiOperation({ summary: 'List batch evaluation logs / 정기 심사 로그 목록 조회' })
    @ApiOkResponse({
        type: [EvaluationLogResponseDto],
        description: 'Successfully retrieved evaluation logs / 심사 로그 목록 조회 성공'
    })
    async listEvaluationLogs(): Promise<EvaluationLogResponseDto[]> {
        const result = await this.listEvaluationLogsService.execute();
        return result.map(log => ({
            ...log,
            id: log.id.toString(),
        }));
    }
}
