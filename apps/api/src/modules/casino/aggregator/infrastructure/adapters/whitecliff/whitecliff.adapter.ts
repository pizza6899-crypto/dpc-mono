import { Injectable, Logger } from '@nestjs/common';
import { AggregatorClientPort } from '../../../ports/aggregator.client.port';
import { AggregatorGameDto } from '../../../ports/aggregator-game.dto';
import { Language } from '@prisma/client';
import { mockResponse2 } from './mock2';
import { WhitecliffApiService, ProductGameListResponse, WhitecliffErrorResponse } from 'src/modules/casino/providers/whitecliff/infrastructure/whitecliff-api.service';

@Injectable()
export class WhitecliffAdapter implements AggregatorClientPort {
    private readonly logger = new Logger(WhitecliffAdapter.name);

    constructor(private readonly whitecliffApiService: WhitecliffApiService) { }

    async fetchGameList(useMock: boolean = true): Promise<AggregatorGameDto[]> {
        const language = Language.EN;
        this.logger.log(`Fetching game list from Whitecliff (default language: ${language})...`);

        let response: ProductGameListResponse | WhitecliffErrorResponse;
        if (useMock) {
            response = mockResponse2;
        } else {
            response = await this.whitecliffApiService.getProductGameList({
                gameCurrency: 'KRW', // Default currency for game list sync
                language: language,
            });
        }

        if ('error' in response) {
            this.logger.error(`Whitecliff API Error: ${response.error}`);
            throw new Error(`Whitecliff API Error: ${response.error}`);
        }

        const gameListMap = response.game_list;
        const result: AggregatorGameDto[] = [];

        // 2. Transform to common DTO
        for (const [providerIdStr, games] of Object.entries(gameListMap)) {
            for (const game of games as any[]) {
                result.push({
                    // 필수
                    providerName: game.prd_name,
                    gameName: game.game_name,
                    gameCode: game.game_id.toString(),
                    // Provider/Category 매핑용
                    providerCode: providerIdStr, // WC의 prd_id (예: "1", "28", "226")
                    category: game.prd_category,
                    // 게임 상세 정보
                    gameType: game.game_type,
                    iconUrl: game.game_icon_link,
                    // WC 전용
                    tableId: game.table_id, // null 그대로 전달 (DTO에서 string | null 허용)
                    isEnabled: Boolean(game.is_enabled),
                });
            }
        }

        this.logger.log(`Fetched ${result.length} games from Whitecliff`);
        return result;
    }
}
