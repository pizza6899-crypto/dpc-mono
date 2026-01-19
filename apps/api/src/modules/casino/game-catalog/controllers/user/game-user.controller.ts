import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { FindGamesService } from '../../application/find-games.service';
import { CatalogGameResponseDto } from './dto/response/game.response.dto';
import { GameListRequestDto } from './dto/request/game-list.request.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData } from 'src/common/http/types';

import { Language } from '@repo/database';

@ApiTags('Casino Game')
@Controller('casino/games')
export class GameUserController {
    constructor(
        private readonly findGamesService: FindGamesService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @Public()
    @Paginated()
    @ApiOperation({ summary: 'List active and visible games / 게임 목록 조회' })
    @ApiPaginatedResponse(CatalogGameResponseDto)
    async list(@Query() query: GameListRequestDto): Promise<PaginatedData<CatalogGameResponseDto>> {
        const lang = query.language || Language.EN;
        // Handle providerId if it's a Sqid
        let decodedProviderId: bigint | undefined;
        if (query.providerId) {
            try {
                const result = this.sqidsService.decodeAuto(query.providerId);
                decodedProviderId = result.id;
            } catch (e) {
                // Ignore invalid sqid
            }
        }

        const result = await this.findGamesService.execute({
            providerId: decodedProviderId,
            keyword: query.keyword,
            isEnabled: true,
            isVisible: true,
            page: query.page,
            limit: query.limit,
        });

        return {
            data: result.data.map(game => {
                const translation =
                    game.translations.find(t => t.language === lang) ||
                    game.translations.find(t => t.language === Language.EN) ||
                    game.translations[0];
                return {
                    id: game.id ? this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME) : '',
                    code: game.code,
                    name: translation?.name || game.code,
                    thumbnailUrl: game.thumbnailUrl ?? undefined,
                    bannerUrl: game.bannerUrl ?? undefined,
                    rtp: game.rtp?.toString(),
                    volatility: game.volatility ?? undefined,
                    gameType: game.gameType ?? undefined,
                };
            }),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }
}
