import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindGameProvidersService } from '../../application/provider/find-game-providers.service';
import { UpdateGameProviderService } from '../../application/provider/update-game-provider.service';
import { FindGameProvidersRequestDto } from './dto/request/provider/find-game-providers.dto';
import { UpdateGameProviderRequestDto } from './dto/request/provider/update-game-provider.dto';
import { GameProviderResponseDto } from './dto/response/provider/game-provider.response.dto';
import { CasinoGameProvider } from '../../domain';

@ApiTags('Admin Casino Game Provider')
@Admin()
@Controller('admin/casino/providers')
export class GameProviderAdminController {
    constructor(
        private readonly findGameProvidersService: FindGameProvidersService,
        private readonly updateGameProviderService: UpdateGameProviderService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List game providers / 게임 프로바이더 목록 조회' })
    @ApiResponse({ type: [GameProviderResponseDto] })
    async list(@Query() query: FindGameProvidersRequestDto): Promise<GameProviderResponseDto[]> {
        const providers = await this.findGameProvidersService.execute({
            aggregatorId: query.aggregatorId ? BigInt(query.aggregatorId) : undefined,
        });
        return providers.map((provider) => this.toResponseDto(provider));
    }

    @Patch(':id')
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_PROVIDER',
        category: 'CASINO'
    })
    @ApiOperation({ summary: 'Update game provider / 게임 프로바이더 정보 수정' })
    @ApiResponse({ type: GameProviderResponseDto })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateGameProviderRequestDto,
    ): Promise<GameProviderResponseDto> {
        const provider = await this.updateGameProviderService.execute({
            id: BigInt(id),
            ...dto,
        });
        return this.toResponseDto(provider);
    }

    private toResponseDto(provider: CasinoGameProvider): GameProviderResponseDto {
        return {
            id: provider.id!.toString(),
            aggregatorId: provider.aggregatorId.toString(),
            externalId: provider.externalId,
            name: provider.name,
            code: provider.code,
            groupCode: provider.groupCode,
            imageUrl: provider.imageUrl,
            isActive: provider.isActive,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }
}
