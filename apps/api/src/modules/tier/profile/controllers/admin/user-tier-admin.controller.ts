import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserTierDetailService } from '../../application/get-user-tier-detail.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { GetUsersNeedingEvaluationService } from '../../application/get-users-needing-evaluation.service';
import { UpdateUserTierCustomService } from '../../application/update-user-tier-custom.service';
import { ForceUpdateUserTierService } from '../../application/force-update-user-tier.service';
import { ResetUserTierPerformanceService } from '../../application/reset-user-tier-performance.service';

import { UserTierAdminResponseDto } from './dto/user-tier-admin.response.dto';
import { UserTierHistoryResponseDto } from '../public/dto/user-tier-history.response.dto';
import {
    UpdateUserTierCustomRequestDto,
    ForceUpdateTierRequestDto,
    UsersNeedingEvaluationResponseDto
} from './dto/user-tier-admin.request.dto';

import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { Admin } from 'src/common/auth/decorators/roles.decorator';

import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('Admin User Tiers')
@Controller('admin/user-tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Admin()
export class UserTierAdminController {
    constructor(
        private readonly getUserTierDetailService: GetUserTierDetailService,
        private readonly getUserTierHistoryService: GetUserTierHistoryService,
        private readonly getUsersNeedingEvaluationService: GetUsersNeedingEvaluationService,
        private readonly updateUserTierCustomService: UpdateUserTierCustomService,
        private readonly forceUpdateUserTierService: ForceUpdateUserTierService,
        private readonly resetUserTierPerformanceService: ResetUserTierPerformanceService,
    ) { }

    @Get('users/needing-evaluation')
    @ApiOperation({ summary: 'Get users needing evaluation / 심사 대상자 목록 조회' })
    @ApiOkResponse({ type: [UsersNeedingEvaluationResponseDto], description: 'Successfully retrieved users needing evaluation / 심사 대상자 목록 조회 성공' })
    async getUsersNeedingEvaluation(): Promise<UsersNeedingEvaluationResponseDto[]> {
        return this.getUsersNeedingEvaluationService.execute();
    }

    @Get('users/:userId')
    @ApiOperation({ summary: 'Get user tier details / 유저 티어 상세 정보 조회' })
    @ApiOkResponse({ type: UserTierAdminResponseDto, description: 'Successfully retrieved user tier details / 유저 티어 상세 정보 조회 성공' })
    async getUserTierDetail(@Param('userId') userId: string): Promise<UserTierAdminResponseDto> {
        return this.getUserTierDetailService.execute(BigInt(userId));
    }

    @Get('users/:userId/history')
    @ApiOperation({ summary: 'Get user tier history / 유저 티어 변경 이력 조회' })
    @ApiOkResponse({ type: [UserTierHistoryResponseDto], description: 'Successfully retrieved user tier history / 유저 티어 변경 이력 조회 성공' })
    async getUserTierHistory(@Param('userId') userId: string): Promise<UserTierHistoryResponseDto[]> {
        return this.getUserTierHistoryService.execute(BigInt(userId));
    }

    @Patch('users/:userId/custom')
    @ApiOperation({ summary: 'Update custom tier benefits / 개별 티어 혜택 수정' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'UPDATE_CUSTOM_BENEFITS',
        extractMetadata: (req) => ({ userId: req.params.userId, body: req.body })
    })
    @ApiOkResponse({ description: 'Successfully updated custom benefits / 개별 혜택 수정 성공' })
    async updateUserTierCustom(
        @Param('userId') userId: string,
        @Body() dto: UpdateUserTierCustomRequestDto
    ): Promise<void> {
        return this.updateUserTierCustomService.execute(BigInt(userId), dto);
    }

    @Post('users/:userId/force-update')
    @ApiOperation({ summary: 'Force update user tier / 티어 강제 업데이트' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'FORCE_UPDATE_TIER',
        extractMetadata: (req) => ({ userId: req.params.userId, body: req.body })
    })
    @ApiOkResponse({ description: 'Successfully force updated user tier / 티어 강제 업데이트 성공' })
    async forceUpdateUserTier(
        @Param('userId') userId: string,
        @Body() dto: ForceUpdateTierRequestDto
    ): Promise<void> {
        return this.forceUpdateUserTierService.execute(BigInt(userId), BigInt(dto.targetTierId), dto.reason);
    }

    @Post('users/:userId/reset')
    @ApiOperation({ summary: 'Reset performance for current period / 현재 주기 실적 초기화' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'RESET_PERFORMANCE',
        extractMetadata: (req) => ({ userId: req.params.userId })
    })
    @ApiOkResponse({ description: 'Successfully reset performance / 실적 초기화 성공' })
    async resetUserTierPerformance(@Param('userId') userId: string): Promise<void> {
        return this.resetUserTierPerformanceService.execute(BigInt(userId));
    }
}
