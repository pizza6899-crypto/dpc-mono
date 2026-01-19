import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncGamesService } from '../../application/sync-games.service';
import { SyncResultResponseDto } from './dto/response/sync-result.response.dto';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('Casino Game (Admin)')
@Controller('admin/casino/sync')
@Admin()
export class SyncAdminController {
    constructor(private readonly syncGamesService: SyncGamesService) { }

    @Post('games')
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'SYNC_GAMES',
        category: 'GAME_MANAGEMENT',
    })
    @ApiOperation({ summary: 'Sync games from all aggregators (전체 게임 동기화)' })
    @ApiResponse({ type: SyncResultResponseDto })
    async syncGames(): Promise<SyncResultResponseDto> {
        return this.syncGamesService.execute();
    }
}
