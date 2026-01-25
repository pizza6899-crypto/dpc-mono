import { Injectable, Logger } from '@nestjs/common';

import { AggregatorClientPort } from '../../../ports/aggregator.client.port';
import { AggregatorGameDto } from '../../../ports/aggregator-game.dto';
import { mockResponse1 } from './dc-mock1';

@Injectable()
export class DcsAdapter implements AggregatorClientPort {
    private readonly logger = new Logger(DcsAdapter.name);

    // DCS는 언어와 무관하게 동일 결과 반환 (영어 이름만 제공)
    async fetchGameList(useMock: boolean = true): Promise<AggregatorGameDto[]> {
        this.logger.log('Fetching game list from DCS...');

        if (!useMock) {
            this.logger.warn('Real API fetch for DCS game list is not yet implemented. Falling back to Mock.');
            // TODO: implement actual DCS API call (needs looping through providers)
        }
        const response = mockResponse1;
        const result: AggregatorGameDto[] = [];

        for (const game of response.data) {
            result.push({
                // 필수
                providerName: game.content, // "Play'n GO" 등
                gameName: game.game_name,
                gameCode: game.game_id.toString(),
                // 추가 권장
                providerCode: game.provider, // "png" 등
                category: game.content_type || undefined, // "Standard" 등
                // 선택적
                gameType: game.game_type || undefined, // "5-Reel Slot Machine" 등
                iconUrl: game.game_icon || undefined,
                isEnabled: true, // DCS 게임 리스트에 존재하는 게임은 활성 상태로 간주
            });
        }

        this.logger.log(`Fetched ${result.length} games from DCS`);
        return result;
    }
}

