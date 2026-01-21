import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { Prisma } from '@prisma/client';

import { FindGamesService } from '../../application/find-games.service';
import { UpdateGameService } from '../../application/update-game.service';

import { GameAdminResponseDto } from './dto/response/game-admin.response.dto';
import { GetGamesAdminQueryDto } from './dto/request/get-games-admin-query.dto';
import { UpdateGameAdminRequestDto } from './dto/request/update-game.request.dto';

import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { CasinoGameV2 } from '../../domain';

@ApiTags('Admin Casino Game')
@Controller('admin/casino/games')
@Admin()
export class GameAdminController {
    constructor(
        private readonly findGamesService: FindGamesService,
        private readonly updateGameService: UpdateGameService,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({
        summary: 'List all games (Admin) / 모든 게임 목록 조회 (관리자)',
        description: 'Retrieves a paginated list of all casino games with administrative details. / 관리자 측면에서의 모든 카지노 게임 목록을 페이징하여 조회합니다.',
    })
    @ApiPaginatedResponse(GameAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'GAME_LIST_ADMIN',
        extractMetadata: (req, args) => ({
            query: args[0],
        }),
    })
    async list(@Query() query: GetGamesAdminQueryDto) {
        const result = await this.findGamesService.execute({
            page: query.page,
            limit: query.limit,
            isEnabled: query.isEnabled,
            isVisible: query.isVisible,
            providerId: query.providerId ? BigInt(query.providerId) : undefined,
            categoryId: query.categoryId ? BigInt(query.categoryId) : undefined,
            keyword: query.keyword,
        });

        return {
            data: result.data.map(game => this.toResponseDto(game)),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a game (Admin) / 게임 수정 (관리자)',
        description: 'Updates an existing game identified by its internal ID. Game creation is only available via aggregator sync. / 내부 ID로 식별된 기존 게임 정보를 수정합니다. 게임 생성은 애그리게이터 동기화로만 가능합니다.',
    })
    @ApiStandardResponse(GameAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'GAME_UPDATE_ADMIN',
        extractMetadata: (req, args, result: GameAdminResponseDto) => ({
            id: args[0],
            updates: args[1],
        }),
    })
    async update(@Param('id') id: string, @Body() dto: UpdateGameAdminRequestDto) {
        const game = await this.updateGameService.execute({
            ...dto,
            id: BigInt(id),
            rtp: dto.rtp ? new Prisma.Decimal(dto.rtp) : undefined,
            houseEdge: dto.houseEdge ? new Prisma.Decimal(dto.houseEdge) : undefined,
            contributionRate: dto.contributionRate ? new Prisma.Decimal(dto.contributionRate) : undefined,
        });

        return this.toResponseDto(game);
    }

    private toResponseDto(game: CasinoGameV2): GameAdminResponseDto {
        return {
            id: game.id?.toString() ?? '',
            providerId: game.providerId.toString(),
            externalGameId: game.externalGameId,
            code: game.code,
            thumbnailUrl: game.thumbnailUrl ?? undefined,
            bannerUrl: game.bannerUrl ?? undefined,
            rtp: game.rtp?.toString(),
            volatility: game.volatility ?? undefined,
            gameType: game.gameType ?? undefined,
            tableId: game.tableId ?? undefined,
            tags: game.tags,
            houseEdge: game.houseEdge.toString(),
            contributionRate: game.contributionRate.toString(),
            sortOrder: game.sortOrder,
            isEnabled: game.isEnabled,
            isVisible: game.isVisible,
            translations: game.translations.map(t => ({
                language: t.language,
                name: t.name,
            })),
        };
    }
}
