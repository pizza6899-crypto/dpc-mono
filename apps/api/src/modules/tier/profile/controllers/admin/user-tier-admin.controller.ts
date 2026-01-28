import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserTierDetailService } from '../../application/get-user-tier-detail.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { GetTierDistributionService } from '../../application/get-tier-distribution.service';
import { GetUsersNeedingEvaluationService } from '../../application/get-users-needing-evaluation.service';
import { UpdateUserTierCustomService } from '../../application/update-user-tier-custom.service';
import { ForceUpdateUserTierService } from '../../application/force-update-user-tier.service';
import { ResetUserTierPerformanceService } from '../../application/reset-user-tier-performance.service';

import { UserTierAdminResponseDto } from './dto/user-tier-admin.response.dto';
import { UserTierHistoryResponseDto } from '../public/dto/user-tier-history.response.dto';
import {
    UpdateUserTierCustomRequestDto,
    ForceUpdateTierRequestDto,
    TierDistributionResponseDto
} from './dto/user-tier-admin.request.dto';

import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { Admin } from 'src/common/auth/decorators/roles.decorator';

@ApiTags('Tier (Admin)')
@Controller('v1/admin/tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Admin()
export class UserTierAdminController {
    constructor(
        private readonly getUserTierDetailService: GetUserTierDetailService,
        private readonly getUserTierHistoryService: GetUserTierHistoryService,
        private readonly getTierDistributionService: GetTierDistributionService,
        private readonly getUsersNeedingEvaluationService: GetUsersNeedingEvaluationService,
        private readonly updateUserTierCustomService: UpdateUserTierCustomService,
        private readonly forceUpdateUserTierService: ForceUpdateUserTierService,
        private readonly resetUserTierPerformanceService: ResetUserTierPerformanceService,
    ) { }

    @Get('stats/distribution')
    @ApiOperation({ summary: 'Get distribution of users across tiers' })
    @ApiOkResponse({ type: [TierDistributionResponseDto] })
    async getTierDistribution(): Promise<TierDistributionResponseDto[]> {
        return this.getTierDistributionService.execute();
    }

    @Get('users/needing-evaluation')
    @ApiOperation({ summary: 'Get list of users needing tier evaluation' })
    async getUsersNeedingEvaluation(): Promise<any[]> {
        return this.getUsersNeedingEvaluationService.execute();
    }

    @Get('users/:userId')
    @ApiOperation({ summary: 'Get detailed tier status of a specific user' })
    @ApiOkResponse({ type: UserTierAdminResponseDto })
    async getUserTierDetail(@Param('userId') userId: string): Promise<UserTierAdminResponseDto> {
        return this.getUserTierDetailService.execute(BigInt(userId));
    }

    @Get('users/:userId/history')
    @ApiOperation({ summary: 'Get tier change history of a specific user' })
    @ApiOkResponse({ type: [UserTierHistoryResponseDto] })
    async getUserTierHistory(@Param('userId') userId: string): Promise<UserTierHistoryResponseDto[]> {
        return this.getUserTierHistoryService.execute(BigInt(userId));
    }

    @Patch('users/:userId/custom')
    @ApiOperation({ summary: 'Update custom tier settings for a user' })
    async updateUserTierCustom(
        @Param('userId') userId: string,
        @Body() dto: UpdateUserTierCustomRequestDto
    ): Promise<void> {
        return this.updateUserTierCustomService.execute(BigInt(userId), dto);
    }

    @Post('users/:userId/force-update')
    @ApiOperation({ summary: 'Forcefully update user tier' })
    async forceUpdateUserTier(
        @Param('userId') userId: string,
        @Body() dto: ForceUpdateTierRequestDto
    ): Promise<void> {
        return this.forceUpdateUserTierService.execute(BigInt(userId), BigInt(dto.targetTierId), dto.reason);
    }

    @Post('users/:userId/reset')
    @ApiOperation({ summary: 'Reset user tier performance for current period' })
    async resetUserTierPerformance(@Param('userId') userId: string): Promise<void> {
        return this.resetUserTierPerformanceService.execute(BigInt(userId));
    }
}
