import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { GrantRewardService } from '../../application/grant-reward.service';
import { GetAdminRewardsService } from '../../application/get-admin-rewards.service';
import { VoidRewardService } from '../../application/void-reward.service';
import { GetAdminRewardsRequestDto } from './dto/request/get-admin-rewards.request.dto';
import { GrantRewardRequestDto } from './dto/request/grant-reward.request.dto';
import { VoidRewardRequestDto } from './dto/request/void-reward.request.dto';
import { AdminRewardResponseDto } from './dto/response/reward.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import Decimal from 'decimal.js';

@ApiTags('Admin Reward')
@Controller('admin/rewards')
@Admin()
@ApiStandardErrors()
export class RewardAdminController {
    constructor(
        private readonly grantRewardService: GrantRewardService,
        private readonly getAdminRewardsService: GetAdminRewardsService,
        private readonly voidRewardService: VoidRewardService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get rewards list / 보상 목록 조회 (어드민)',
        description: '시스템 또는 관리자가 전체 유저의 보상 목록을 조회합니다. 유저 ID, 상태 등 다양한 필터링을 지원합니다.',
    })
    @ApiPaginatedResponse(AdminRewardResponseDto)
    async getRewards(@Query() query: GetAdminRewardsRequestDto): Promise<PaginatedData<AdminRewardResponseDto>> {
        return this.getAdminRewardsService.execute(query);
    }

    @Post('grant')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Grant a reward / 유저 보상 지급',
        description: '시스템 또는 관리자가 특정 유저에게 보상을 수동 지급합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'GRANT_REWARD',
        extractMetadata: (req, args) => ({
            userId: args[0].userId,
            amount: args[0].amount,
            currency: args[0].currency,
            rewardType: args[0].rewardType,
        }),
    })
    @ApiStandardResponse(AdminRewardResponseDto, { status: HttpStatus.CREATED })
    async grantReward(@Body() dto: GrantRewardRequestDto): Promise<AdminRewardResponseDto> {
        const reward = await this.grantRewardService.execute({
            userId: BigInt(dto.userId),
            sourceType: dto.sourceType,
            sourceId: dto.sourceId ? BigInt(dto.sourceId) : undefined,
            rewardType: dto.rewardType,
            currency: dto.currency,
            amount: new Decimal(dto.amount),
            wageringTargetType: dto.wageringTargetType,
            wageringMultiplier: dto.wageringMultiplier ? new Decimal(dto.wageringMultiplier) : undefined,
            wageringExpiryDays: dto.wageringExpiryDays,
            maxCashConversion: dto.maxCashConversion ? new Decimal(dto.maxCashConversion) : undefined,
            isForfeitable: dto.isForfeitable,
            expiresAt: dto.expiresAt,
            metadata: dto.metadata as any,
            reason: dto.reason,
        });

        return {
            id: reward.id.toString(),
            userId: reward.userId.toString(),
            sourceType: reward.sourceType,
            sourceId: reward.sourceId?.toString(),
            rewardType: reward.rewardType,
            currency: reward.currency,
            amount: reward.amount.toString(),
            wageringTargetType: reward.wageringTargetType,
            wageringMultiplier: reward.wageringMultiplier?.toString(),
            wageringExpiryDays: reward.wageringExpiryDays,
            maxCashConversion: reward.maxCashConversion?.toString(),
            isForfeitable: reward.isForfeitable,
            status: reward.status,
            expiresAt: reward.expiresAt,
            claimedAt: reward.claimedAt,
            metadata: reward.metadata,
            reason: reward.reason,
            createdAt: reward.createdAt,
            updatedAt: reward.updatedAt,
        };
    }

    @Post(':id/void')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Void a reward / 유저 보상 취소(무효화)',
        description: '지급된 보상을 취소(VOID) 처리합니다. (단, 이미 CLAIMED된 보상은 취소 불가)',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN',
        action: 'VOID_REWARD',
        extractMetadata: (req, args) => ({
            rewardId: args[0], // id
            reason: args[1]?.reason, // dto.reason
        }),
    })
    @ApiStandardResponse(AdminRewardResponseDto, { status: HttpStatus.OK, description: '보상 취소 완료' })
    async voidReward(
        @Param('id') id: string,
        @Body() dto: VoidRewardRequestDto,
    ): Promise<AdminRewardResponseDto> {
        const reward = await this.voidRewardService.execute({
            rewardId: BigInt(id),
            reason: dto.reason,
        });

        return {
            id: reward.id.toString(),
            userId: reward.userId.toString(),
            sourceType: reward.sourceType,
            sourceId: reward.sourceId?.toString() ?? null,
            rewardType: reward.rewardType,
            currency: reward.currency,
            amount: reward.amount.toString(),
            wageringTargetType: reward.wageringTargetType,
            wageringMultiplier: reward.wageringMultiplier?.toString() ?? null,
            wageringExpiryDays: reward.wageringExpiryDays,
            maxCashConversion: reward.maxCashConversion?.toString() ?? null,
            isForfeitable: reward.isForfeitable,
            status: reward.status,
            expiresAt: reward.expiresAt,
            claimedAt: reward.claimedAt,
            metadata: reward.metadata,
            reason: reward.reason,
            createdAt: reward.createdAt,
            updatedAt: reward.updatedAt,
        };
    }
}
