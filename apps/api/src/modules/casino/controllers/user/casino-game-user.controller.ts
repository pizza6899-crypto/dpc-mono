import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthAll, Public } from 'src/common/auth/decorators/roles.decorator';
import {
    ApiPaginatedResponse,
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { CasinoGameService } from '../../application/casino-game.service';
import { GameListRequestDto } from './dto/request/game-list.request.dto';
import { GameResponseDto } from './dto/response/game.response.dto';
import { GameLaunchRequestDto } from './dto/request/game-launch.request.dto';
import { GameLaunchResponseDto } from './dto/response/game-launch.response.dto';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@Controller('casino/games')
@ApiTags('Casino Games')
@ApiStandardErrors()
export class CasinoGameUserController {
    constructor(
        private readonly casinoGameService: CasinoGameService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Post('launch')
    @AuthAll()
    @HttpCode(HttpStatus.OK)
    @Throttle({
        limit: 30,
        ttl: 60, // 1분
        scope: ThrottleScope.USER,
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'LAUNCH_GAME',
        extractMetadata: (_, args, result) => ({
            gameId: args[1]?.id,
            walletCurrency: args[1]?.walletCurrency,
            gameCurrency: args[1]?.gameCurrency,
            isMobile: args[1]?.isMobile,
        }),
    })
    @ApiOperation({ summary: 'Launch Game (게임 실행)' })
    @ApiStandardResponse(GameLaunchResponseDto, {
        status: 200,
        description: 'Game launch success (게임 실행 성공)',
    })
    async launchGame(
        @CurrentUser() user: CurrentUserWithSession,
        @Body() data: GameLaunchRequestDto,
        @RequestClientInfoParam() request: RequestClientInfo,
    ): Promise<GameLaunchResponseDto> {
        const decodedId = this.sqidsService.decode(data.id, SqidsPrefix.CASINO_GAME);
        const result = await this.casinoGameService.launchGame(
            user,
            {
                id: Number(decodedId),
                isMobile: data.isMobile,
                walletCurrency: data.walletCurrency,
                gameCurrency: data.gameCurrency,
            },
            request,
        );

        return result;
    }

    @Get('list')
    @Public()
    @HttpCode(HttpStatus.OK)
    @Throttle({
        limit: 100,
        ttl: 60, // 1분
        scope: ThrottleScope.IP,
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'GAME_LIST_VIEW',
        extractMetadata: (_, args, result) => ({
            totalGames: result?.total,
            page: args[0]?.page,
            category: args[0]?.category,
            provider: args[0]?.providerId,
        }),
    })
    @ApiOperation({ summary: 'Get Game List (게임 목록 조회)' })
    @ApiPaginatedResponse(GameResponseDto, {
        status: 200,
        description: 'Game list retrieved successfully (게임 목록 조회 성공)',
    })
    async getGameList(
        @Query() query: GameListRequestDto,
    ): Promise<PaginatedData<GameResponseDto>> {
        const result = await this.casinoGameService.getGameList(query);
        return {
            data: result.data.map(game => ({
                id: this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME),
                name: game.name,
                category: game.category,
                provider: game.provider,
                imageUrl: game.imageUrl,
            })),
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }
}
