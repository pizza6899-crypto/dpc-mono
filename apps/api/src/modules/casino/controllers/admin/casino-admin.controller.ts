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

import { CasinoGameService } from '../../application/casino-game.service';
import { AdminGameListRequestDto } from './dto/request/admin-game-list.request.dto';
import { AdminGameResponseDto } from './dto/response/admin-game.response.dto';
import { AdminUpdateGameRequestDto } from './dto/request/admin-update-game.request.dto';

@ApiTags('Admin Casino')
@Controller('admin/casino')
@Admin()
@ApiStandardErrors()
export class CasinoAdminController {
    constructor(
        private readonly casinoGameService: CasinoGameService,
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
        // NOTE: 이 부분은 CasinoGameService에 관리사용 전용 메서드를 추가하거나 
        // 기존 메서드에 필터를 추가하여 구현해야 합니다. 
        // 현재는 스캐폴딩이므로 구체적인 구현은 생략하거나 Mock 처리합니다.
        const result = await this.casinoGameService.getGameList({
            ...query,
            // 관리자용은 isEnabled 필터 등이 추가될 수 있음
        });

        return {
            data: result.data.map(game => ({
                id: this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME),
                name: game.name,
                category: game.category,
                provider: game.provider,
                imageUrl: game.imageUrl,
                // 아래 필드들은 DB 세부 정보에서 가져와야 함
                aggregatorType: 'WHITECLIFF' as any, // Mock
                isEnabled: true,
                isVisibleToUser: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    @Get('games/:id')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CASINO',
        action: 'ADMIN_GAME_DETAIL_VIEW',
        extractMetadata: (_, args) => ({
            id: args[0],
        }),
    })
    @ApiOperation({ summary: 'Get game detail / 게임 상세 정보 조회 (관리자)' })
    @ApiStandardResponse(AdminGameResponseDto, {
        description: 'Successfully retrieved game detail / 게임 상세 조회 성공',
    })
    async findOneGame(@Param('id') id: string): Promise<AdminGameResponseDto> {
        const decodedId = this.sqidsService.decode(id, SqidsPrefix.CASINO_GAME);
        // DB에서 직접 조회하는 로직 필요
        return {
            id: id,
            name: 'Mock Game',
            category: 'SLOT' as any,
            provider: 'PRAGMATIC_PLAY' as any,
            aggregatorType: 'WHITECLIFF' as any,
            imageUrl: '',
            isEnabled: true,
            isVisibleToUser: true,
            createdAt: new Date(),
            updatedAt: new Date(),
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
        const decodedId = this.sqidsService.decode(id, SqidsPrefix.CASINO_GAME);
        // 업데이트 로직 필요
        return {
            id: id,
            name: 'Updated Game',
            category: 'SLOT' as any,
            provider: 'PRAGMATIC_PLAY' as any,
            aggregatorType: 'WHITECLIFF' as any,
            imageUrl: '',
            isEnabled: dto.isEnabled ?? true,
            isVisibleToUser: dto.isVisibleToUser ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
