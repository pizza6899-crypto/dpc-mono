import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Put,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import {
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
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
    ) { }

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
        return new TierResponseDto(tier);
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
        return tiers.map(tier => new TierResponseDto(tier));
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
        return new TierResponseDto(tier);
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
}
