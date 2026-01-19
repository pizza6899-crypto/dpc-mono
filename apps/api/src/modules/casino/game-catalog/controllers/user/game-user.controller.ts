import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

import { FindGamesService } from '../../application/find-games.service';
import { GameResponseDto } from './dto/response/game.response.dto';
import { GameListRequestDto } from './dto/request/game-list.request.dto';

@ApiTags('Casino Game')
@Controller('casino/games')
export class GameUserController {
    constructor(
        private readonly findGamesService: FindGamesService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List active and visible games' })
    @ApiStandardResponse(GameResponseDto, { isArray: true })
    async list(@Query() query: GameListRequestDto) {
        // Handle providerId if it's a Sqid
        let decodedProviderId: bigint | undefined;
        if (query.providerId) {
            try {
                // Try to decode with or without prefix
                const result = this.sqidsService.decodeAuto(query.providerId);
                decodedProviderId = result.id;
            } catch (e) {
                // If it's not a valid Sqid, it might be a raw ID (though unlikely for users)
                // Or we just ignore it.
            }
        }

        const games = await this.findGamesService.execute({
            providerId: decodedProviderId,
            isEnabled: true,
            isVisible: true,
            limit: query.limit || 30,
            offset: ((query.page || 1) - 1) * (query.limit || 30),
        });

        return games.map(game => ({
            id: game.id ? this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME) : '',
            code: game.code,
            thumbnailUrl: game.thumbnailUrl,
            bannerUrl: game.bannerUrl,
            rtp: game.rtp?.toString(),
            volatility: game.volatility,
            gameType: game.gameType,
            translations: game.translations,
        }));
    }
}
