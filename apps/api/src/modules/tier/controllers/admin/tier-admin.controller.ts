import { Controller, Get, Post, Body, Patch, Put, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from 'src/generated/prisma';
import {
    ApiStandardErrors,
    ApiStandardResponse,
    ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

import { CreateTierService } from '../../application/create-tier.service';
import { UpdateTierService } from '../../application/update-tier.service';
import { FindTiersService } from '../../application/find-tiers.service';
import { UpdateTierTranslationService } from '../../application/translation/update-tier-translation.service';
import { CreateTierDto } from './dto/request/create-tier.dto';
import { UpdateTierDto } from './dto/request/update-tier.dto';
import { TierResponseDto } from './dto/response/tier.response.dto';
import { UpdateTierTranslationDto } from './dto/request/translation/update-tier-translation.dto';
import { TierParamDto, TierTranslationParamDto } from './dto/request/tier-param.dto';
import { ForceUpdateUserTierService } from '../../application/force-update-user-tier.service';
import { CountUsersByTierService } from '../../application/count-users-by-tier.service';
import { ForceUpdateUserTierDto } from './dto/request/force-update-user-tier.dto';
import { TierUserCountResponseDto } from './dto/response/tier-user-count.response.dto';
import { UserParamDto } from './dto/request/user-param.dto';
import { FindTierHistoryService } from '../../application/find-tier-history.service';
import { FindTierHistoryRequestDto } from './dto/request/find-tier-history.request.dto';
import { TierHistoryResponseDto } from './dto/response/tier-history.response.dto';
import { FindUsersByTierService } from '../../application/find-users-by-tier.service';
import { TierUserListQueryDto } from './dto/request/tier-user-list-query.dto';
import { UserTierResponseDto } from '../user/dto/response/user-tier.response.dto';
import { InitializeMissingUserTiersService } from '../../application/initialize-missing-user-tiers.service';
import { SyncMissingUsersResponseDto } from './dto/response/sync-missing-users-response.dto';
import { GetUserTierService } from '../../application/get-user-tier.service';
import { UnlockUserTierService } from '../../application/unlock-user-tier.service';
import { UnlockUserTierDto } from './dto/request/unlock-user-tier.dto';
import { UserTierNotFoundException } from '../../domain/tier.exception';

@ApiTags('Admin Tiers')
@Controller('admin/tiers')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class TierAdminController {
    constructor(
        private readonly createTierService: CreateTierService,
        private readonly updateTierService: UpdateTierService,
        private readonly findTiersService: FindTiersService,
        private readonly updateTierTranslationService: UpdateTierTranslationService,
        private readonly forceUpdateUserTierService: ForceUpdateUserTierService,
        private readonly countUsersByTierService: CountUsersByTierService,
        private readonly findUsersByTierService: FindUsersByTierService,
        private readonly initializeMissingUserTiersService: InitializeMissingUserTiersService,
        private readonly getUserTierService: GetUserTierService,
        private readonly unlockUserTierService: UnlockUserTierService,
        private readonly findTierHistoryService: FindTierHistoryService,
    ) { }

    @Get('users/:userId')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'USER_TIER_VIEW',
        extractMetadata: (_, args) => ({
            userId: args[0]?.userId,
        }),
    })
    @ApiOperation({ summary: 'Get user tier / 사용자의 티어 조회' })
    @ApiStandardResponse(UserTierResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved user tier / 티어 조회 성공',
    })
    async getUserTier(@Param() params: UserParamDto): Promise<UserTierResponseDto> {
        const userTier = await this.getUserTierService.execute(BigInt(params.userId));
        if (!userTier) {
            throw new UserTierNotFoundException(params.userId);
        }
        return {
            id: userTier.id?.toString() ?? '',
            tierCode: userTier.tier?.code ?? 'UNKNOWN',
            totalRollingUsd: userTier.totalRollingUsd.toString(),
            highestPromotedPriority: userTier.highestPromotedPriority,
            isManualLock: userTier.isManualLock,
            lastPromotedAt: userTier.lastPromotedAt,
            tierRequirementUsd: userTier.tier?.requirementUsd.toString(),
            tierTranslations: userTier.tier?.translations.map(t => ({
                language: t.language as any,
                name: t.name,
            })),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_CREATE',
        extractMetadata: (_, args, result) => ({
            createdTierId: result?.id,
            code: args[0]?.code,
        }),
    })
    @ApiOperation({ summary: 'Create new tier / 새로운 티어 생성' })
    @ApiStandardResponse(TierResponseDto, {
        status: HttpStatus.CREATED,
        description: 'Successfully created new tier / 티어 생성 성공',
    })
    async create(@Body() dto: CreateTierDto): Promise<TierResponseDto> {
        const tier = await this.createTierService.execute(dto);
        return {
            id: tier.id?.toString() ?? '',
            priority: tier.priority,
            code: tier.code,
            requirementUsd: tier.requirementUsd.toString(),
            levelUpBonusUsd: tier.levelUpBonusUsd.toString(),
            compRate: tier.compRate.toString(),
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
            translations: tier.translations.map(t => ({
                language: t.language as any,
                name: t.name,
            })),
        };
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_LIST_VIEW',
        extractMetadata: (_, args, result) => ({
            count: result?.length ?? 0,
        }),
    })
    @ApiOperation({ summary: 'List all tiers / 모든 티어 목록 조회' })
    @ApiStandardResponse(TierResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved all tiers / 티어 목록 조회 성공',
        isArray: true,
    })
    async findAll(): Promise<TierResponseDto[]> {
        const tiers = await this.findTiersService.execute();
        return tiers.map(tier => ({
            id: tier.id?.toString() ?? '',
            priority: tier.priority,
            code: tier.code,
            requirementUsd: tier.requirementUsd.toString(),
            levelUpBonusUsd: tier.levelUpBonusUsd.toString(),
            compRate: tier.compRate.toString(),
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
            translations: tier.translations.map(t => ({
                language: t.language as any,
                name: t.name,
            })),
        }));
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_UPDATE',
        extractMetadata: (_, args, result) => ({
            tierId: args[0]?.id,
            changes: args[1],
        }),
    })
    @ApiOperation({ summary: 'Update tier / 티어 수정' })
    @ApiStandardResponse(TierResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated tier / 티어 수정 성공',
    })
    async update(
        @Param() params: TierParamDto,
        @Body() dto: UpdateTierDto,
    ): Promise<TierResponseDto> {
        const tier = await this.updateTierService.execute({
            ...dto,
            id: BigInt(params.id),
        });
        return {
            id: tier.id?.toString() ?? '',
            priority: tier.priority,
            code: tier.code,
            requirementUsd: tier.requirementUsd.toString(),
            levelUpBonusUsd: tier.levelUpBonusUsd.toString(),
            compRate: tier.compRate.toString(),
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
            translations: tier.translations.map(t => ({
                language: t.language as any,
                name: t.name,
            })),
        };
    }

    @Put(':id/translations/:language')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_TRANSLATION_UPSERT',
        extractMetadata: (_, args) => ({
            tierId: args[0]?.id,
            language: args[0]?.language,
            name: args[1]?.name,
        }),
    })
    @ApiOperation({ summary: 'Upsert tier translation / 티어 번역 등록 및 수정' })
    @ApiStandardResponse(undefined, {
        status: HttpStatus.OK,
        description: 'Successfully upserted tier translation / 티어 번역 등록 성공',
    })
    async upsertTranslation(
        @Param() params: TierTranslationParamDto,
        @Body() dto: UpdateTierTranslationDto,
    ): Promise<void> {
        await this.updateTierTranslationService.execute(BigInt(params.id), params.language, dto.name);
    }

    @Post('users/:userId/force')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_FORCE_UPDATE',
        extractMetadata: (_, args) => ({
            userId: args[0],
            tierCode: args[1]?.tierCode,
            reason: args[1]?.reason,
        }),
    })
    @ApiOperation({ summary: 'Force update user tier / 사용자 티어 강제 변경' })
    @ApiStandardResponse(undefined, {
        status: HttpStatus.OK,
        description: 'Successfully forced updated user tier / 사용자 티어 강제 변경 성공',
    })
    async forceUpdateUserTier(
        @Param() params: UserParamDto,
        @Body() dto: ForceUpdateUserTierDto,
    ): Promise<void> {
        await this.forceUpdateUserTierService.execute(BigInt(params.userId), dto.tierCode, dto.reason ?? 'Admin forced update');
    }

    @Post('users/:userId/unlock')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_UNLOCK',
        extractMetadata: (_, args) => ({
            userId: args[0],
            reason: args[1]?.reason,
        }),
    })
    @ApiOperation({ summary: 'Unlock user tier / 사용자 티어 잠금 해제' })
    @ApiStandardResponse(undefined, {
        status: HttpStatus.OK,
        description: 'Successfully unlocked user tier / 사용자 티어 잠금 해제 성공',
    })
    async unlockUserTier(
        @Param() params: UserParamDto,
        @Body() dto: UnlockUserTierDto,
    ): Promise<void> {
        await this.unlockUserTierService.execute(BigInt(params.userId), dto.reason);
    }

    @Get('stats/counts')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_USER_COUNTS_VIEW',
    })
    @ApiOperation({ summary: 'Get tier user counts / 티어별 사용자 수 조회' })
    @ApiStandardResponse(TierUserCountResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved tier user counts / 티어별 사용자 수 조회 성공',
        isArray: true,
    })
    async getTierUserCounts(): Promise<TierUserCountResponseDto[]> {
        return this.countUsersByTierService.execute();
    }

    @Get('history')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_HISTORY_VIEW',
    })
    @ApiOperation({ summary: 'Get tier history / 티어 변경 이력 조회' })
    @Paginated()
    @ApiPaginatedResponse(TierHistoryResponseDto, {
        description: 'Successfully retrieved tier history / 티어 변경 이력 조회 성공',
    })
    async getTierHistory(
        @Query() query: FindTierHistoryRequestDto,
    ): Promise<PaginatedData<TierHistoryResponseDto>> {
        const result = await this.findTierHistoryService.execute({
            userId: query.userId ? BigInt(query.userId) : undefined,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            data: result.items.map(h => ({
                id: h.id?.toString() ?? '',
                userId: h.userId.toString(),
                userEmail: h.userEmail,
                oldTierCode: h.oldTierCode,
                newTierCode: h.newTierCode,
                changeType: h.changeType,
                reason: h.reason,
                createdAt: h.createdAt,
            })),
            total: result.total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }

    @Get('users/:userId/history')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'USER_TIER_HISTORY_VIEW',
        extractMetadata: (_, args) => ({
            userId: args[0]?.userId,
        }),
    })
    @ApiOperation({ summary: 'Get user tier history / 사용자의 티어 변경 이력 조회' })
    @Paginated()
    @ApiPaginatedResponse(TierHistoryResponseDto, {
        description: 'Successfully retrieved user tier history / 티어 변경 이력 조회 성공',
    })
    async getUserTierHistory(
        @Param() params: UserParamDto,
        @Query() query: FindTierHistoryRequestDto,
    ): Promise<PaginatedData<TierHistoryResponseDto>> {
        const result = await this.findTierHistoryService.execute({
            userId: BigInt(params.userId),
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            data: result.items.map(h => ({
                id: h.id?.toString() ?? '',
                userId: h.userId.toString(),
                userEmail: h.userEmail,
                oldTierCode: h.oldTierCode,
                newTierCode: h.newTierCode,
                changeType: h.changeType,
                reason: h.reason,
                createdAt: h.createdAt,
            })),
            total: result.total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }

    @Get(':id/users')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_USERS_VIEW',
        extractMetadata: (_, args) => ({
            tierId: args[0]?.id,
            query: args[1],
        }),
    })
    @ApiOperation({ summary: 'Get users by tier / 특정 티어의 사용자 목록 조회' })
    @Paginated()
    @ApiPaginatedResponse(UserTierResponseDto, {
        description: 'Successfully retrieved users by tier / 티어별 사용자 목록 조회 성공',
    })
    async findUsersByTier(
        @Param() params: TierParamDto,
        @Query() query: TierUserListQueryDto,
    ): Promise<PaginatedData<UserTierResponseDto>> {
        const [users, total] = await this.findUsersByTierService.execute({
            tierId: BigInt(params.id),
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            data: users.map(userTier => ({
                id: userTier.id?.toString() ?? '',
                tierCode: userTier.tier?.code ?? 'UNKNOWN',
                totalRollingUsd: userTier.totalRollingUsd.toString(),
                highestPromotedPriority: userTier.highestPromotedPriority,
                isManualLock: userTier.isManualLock,
                lastPromotedAt: userTier.lastPromotedAt,
                tierRequirementUsd: userTier.tier?.requirementUsd.toString(),
                tierTranslations: userTier.tier?.translations.map(t => ({
                    language: t.language as any,
                    name: t.name,
                })),
            })),
            total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }

    @Post('sync-missing-users')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'TIER_SYNC_MISSING_USERS',
    })
    @ApiOperation({ summary: 'Sync users without tiers / 티어가 없는 사용자 동기화' })
    @ApiStandardResponse(SyncMissingUsersResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully synced users without tiers / 티어 없는 사용자 동기화 성공',
    })
    async syncMissingUserTiers(): Promise<SyncMissingUsersResponseDto> {
        const result = await this.initializeMissingUserTiersService.execute();
        return new SyncMissingUsersResponseDto(result);
    }
}
