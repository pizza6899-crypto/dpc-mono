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
    @ApiOperation({ summary: 'Upsert tier translation / 티어 번역 등록 및 수정' })
    async upsertTranslation(
        @Param() params: TierTranslationParamDto,
        @Body() dto: UpdateTierTranslationDto,
    ): Promise<void> {
        await this.updateTierTranslationService.execute(BigInt(params.id), params.language, dto.name);
    }
}
