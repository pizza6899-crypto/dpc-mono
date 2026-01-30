import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetTierDistributionService } from '../../application/get-tier-distribution.service';
import { ListEvaluationLogsService } from '../../application/list-evaluation-logs.service';
import { TierDistributionResponseDto } from './dto/tier-distribution.response.dto';
import { GetTierDistributionQueryDto } from './dto/request/get-tier-distribution.query.dto';
import { ListEvaluationLogsQueryDto } from './dto/request/list-evaluation-logs.query.dto';
import { EvaluationLogResponseDto } from './dto/evaluation-log.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
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
    async getTierDistribution(@Query() query: GetTierDistributionQueryDto): Promise<TierDistributionResponseDto[]> {
        return this.getTierDistributionService.execute(query.lang);
    }

    @Get('evaluation-logs')
    @ApiOperation({ summary: 'List batch evaluation logs / 정기 심사 로그 목록 조회' })
    @Paginated()
    @ApiPaginatedResponse(EvaluationLogResponseDto, {
        description: 'Successfully retrieved evaluation logs / 심사 로그 목록 조회 성공'
    })
    async listEvaluationLogs(@Query() query: ListEvaluationLogsQueryDto): Promise<PaginatedData<EvaluationLogResponseDto>> {
        const result = await this.listEvaluationLogsService.execute(query);
        return {
            ...result,
            data: result.data.map(log => ({
                ...log,
                id: log.id.toString(),
            })),
        };
    }
}
