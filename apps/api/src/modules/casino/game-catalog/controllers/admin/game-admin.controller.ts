import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { Prisma } from '@repo/database';

import { FindGamesService } from '../../application/find-games.service';
import { FindGameByIdService } from '../../application/find-game-by-id.service';
import { CreateGameService } from '../../application/create-game.service';
import { UpdateGameService } from '../../application/update-game.service';

import { GameAdminResponseDto } from './dto/response/game-admin.response.dto';
import { CreateGameAdminRequestDto } from './dto/request/create-game.request.dto';

@ApiTags('Admin Casino Game')
@Controller('admin/casino/games')
@Admin()
export class GameAdminController {
    constructor(
        private readonly findGamesService: FindGamesService,
        private readonly findGameByIdService: FindGameByIdService,
        private readonly createGameService: CreateGameService,
        private readonly updateGameService: UpdateGameService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all games (Admin)' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'GAME_LIST_ADMIN' })
    async list(@Query('isEnabled') isEnabled?: boolean) {
        const games = await this.findGamesService.execute({ isEnabled });
        return games.map(game => this.toResponseDto(game));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get game detail (Admin)' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'GAME_DETAIL_ADMIN' })
    async get(@Param('id') id: string) {
        const decodedId = this.sqidsService.decode(id, SqidsPrefix.CASINO_GAME);
        const game = await this.findGameByIdService.execute(BigInt(decodedId));
        return this.toResponseDto(game);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new game (Admin)' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'GAME_CREATE_ADMIN' })
    async create(@Body() dto: CreateGameAdminRequestDto) {
        const providerId = this.sqidsService.decode(dto.providerId); // Assuming providerId matches a Sqid prefix or we use it directly

        const game = await this.createGameService.execute({
            ...dto,
            providerId: BigInt(providerId),
            rtp: dto.rtp ? new Prisma.Decimal(dto.rtp) : undefined,
            houseEdge: dto.houseEdge ? new Prisma.Decimal(dto.houseEdge) : undefined,
            contributionRate: dto.contributionRate ? new Prisma.Decimal(dto.contributionRate) : undefined,
        });

        return this.toResponseDto(game);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a game (Admin)' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'GAME_UPDATE_ADMIN' })
    async update(@Param('id') id: string, @Body() dto: Partial<CreateGameAdminRequestDto>) {
        const decodedId = this.sqidsService.decode(id, SqidsPrefix.CASINO_GAME);

        const game = await this.updateGameService.execute({
            ...dto,
            id: BigInt(decodedId),
            rtp: dto.rtp ? new Prisma.Decimal(dto.rtp) : undefined,
            houseEdge: dto.houseEdge ? new Prisma.Decimal(dto.houseEdge) : undefined,
            contributionRate: dto.contributionRate ? new Prisma.Decimal(dto.contributionRate) : undefined,
        });

        return this.toResponseDto(game);
    }

    private toResponseDto(game: any): GameAdminResponseDto {
        return {
            id: this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME),
            providerId: this.sqidsService.encode(game.providerId), // We might need a prefix for provider
            externalGameId: game.externalGameId,
            code: game.code,
            thumbnailUrl: game.thumbnailUrl,
            bannerUrl: game.bannerUrl,
            rtp: game.rtp?.toString(),
            volatility: game.volatility,
            gameType: game.gameType,
            tableId: game.tableId,
            tags: game.tags,
            houseEdge: game.houseEdge.toString(),
            contributionRate: game.contributionRate.toString(),
            sortOrder: game.sortOrder,
            isEnabled: game.isEnabled,
            isVisible: game.isVisible,
            translations: game.translations,
        };
    }
}
