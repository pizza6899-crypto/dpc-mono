import { Injectable, Logger } from '@nestjs/common';
import { AggregatorClientPort } from '../../../ports/aggregator.client.port';
import { AggregatorGameDto } from '../../../ports/aggregator-game.dto';
import { WhitecliffApiService } from '../../../../whitecliff/infrastructure/whitecliff-api.service';
import { Language } from '@repo/database';
import { mockResponse2 } from './mock2';

@Injectable()
export class WhitecliffAdapter implements AggregatorClientPort {
    private readonly logger = new Logger(WhitecliffAdapter.name);

    constructor(private readonly whitecliffApiService: WhitecliffApiService) { }

    async fetchGameList(): Promise<AggregatorGameDto[]> {
        this.logger.log('Fetching game list from Whitecliff...');

        // 1. Fetch from WC API
        // const response = await this.whitecliffApiService.getProductGameList({
        //     gameCurrency: 'KRW', // 기준 통화 (설정 연동 필요 시 팩토리에서 주입)
        //     language: Language.EN,
        // });

        const response = mockResponse2;
        console.log(response);

        if ('error' in response) {
            this.logger.error(`Whitecliff API Error: ${response.error}`);
            throw new Error(`Whitecliff API Error: ${response.error}`);
        }

        const gameListMap = response.game_list;
        const result: AggregatorGameDto[] = [];

        // 2. Transform to common DTO
        for (const [providerIdStr, games] of Object.entries(gameListMap)) {
            // providerIdStr는 내부 매핑 로직이 필요할 수 있으나, 일단 이름으로 전달하거나 함.
            // 여기서는 `prd_name`이 있으므로 그것을 사용.

            for (const game of games) {
                result.push({
                    providerName: game.prd_name,
                    gameName: game.game_name,
                    gameCode: game.game_id.toString(), // WC의 game_id를 code로 사용
                    // gameType: game.game_type || undefined,
                    // thumbnailUrl: game.game_icon_link || undefined,
                    // tableId: game.table_id || undefined,
                });
            }
        }

        return result;
    }
}
