import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import {
    ApiPaginatedResponse,
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

import { FindCasinoGamesService } from '../../application/find-casino-games.service';
import { UpdateCasinoGameService } from '../../application/update-casino-game.service';
import { AdminGameListRequestDto } from './dto/request/admin-game-list.request.dto';
import { AdminGameResponseDto } from './dto/response/admin-game.response.dto';
import { AdminUpdateGameRequestDto } from './dto/request/admin-update-game.request.dto';
import { CasinoGame } from '../../domain/model/casino-game.entity';

@ApiTags('Admin Casino')
@Controller('admin/casino')
@Admin()
@ApiStandardErrors()
export class CasinoAdminController {
    constructor(
        private readonly findCasinoGamesService: FindCasinoGamesService,
        private readonly updateCasinoGameService: UpdateCasinoGameService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('games')
    @HttpCode(HttpStatus.OK)
    @Paginated()
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'ADMIN_GAME_LIST_VIEW',
    })
    @ApiOperation({ summary: 'Get all casino games / 모든 카지노 게임 목록 조회 (관리자)' })
    @ApiPaginatedResponse(AdminGameResponseDto, {
        description: 'Successfully retrieved all games / 게임 목록 조회 성공',
    })
    async findAllGames(
        @Query() query: AdminGameListRequestDto,
    ): Promise<PaginatedData<AdminGameResponseDto>> {
        const result = await this.findCasinoGamesService.execute(query);

        return {
            data: result.data.map(game => this.toResponseDto(game)),
            total: result.total,
            page: result.page || query.page || 1,
            limit: result.limit || query.limit || 20,
        };
    }

    @Patch('games/:id')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'ADMIN_GAME_UPDATE',
        extractMetadata: (_, args) => ({
            id: args[0],
            updates: args[1],
        }),
    })
    @ApiOperation({ summary: 'Update game / 게임 설정 수정 (관리자)' })
    @ApiStandardResponse(AdminGameResponseDto, {
        description: 'Successfully updated game / 게임 수정 성공',
    })
    async updateGame(
        @Param('id') id: string,
        @Body() dto: AdminUpdateGameRequestDto,
    ): Promise<AdminGameResponseDto> {
        const numericId = Number(this.sqidsService.decode(id, SqidsPrefix.CASINO_GAME));

        const updatedGame = await this.updateCasinoGameService.execute({
            id: numericId,
            ...dto,
        });

        return this.toResponseDto(updatedGame);
    }

    private toResponseDto(game: CasinoGame): AdminGameResponseDto {
        return {
            id: this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME),
            name: game.translations[0]?.gameName || 'Unknown',
            category: game.category,
            provider: game.provider,
            aggregatorType: game.aggregatorType,
            imageUrl: game.iconLink || '',
            isEnabled: game.isEnabled,
            isVisibleToUser: game.isVisibleToUser,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
        };
    }
}
