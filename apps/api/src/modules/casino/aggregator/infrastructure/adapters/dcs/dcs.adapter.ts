import { Injectable, Logger } from '@nestjs/common';
import { DcsApiService } from '../../../../providers/dcs/infrastructure/dcs-api.service';
import { DcsMapperService } from '../../../../providers/dcs/infrastructure/dcs-mapper.service';

import { AggregatorClientPort } from '../../../ports/aggregator.client.port';
import { AggregatorGameDto } from '../../../ports/aggregator-game.dto';
import { mockResponse1 } from './dc-mock1';

@Injectable()
export class DcsAdapter implements AggregatorClientPort {
    private readonly logger = new Logger(DcsAdapter.name);

    constructor(
        private readonly dcsApiService: DcsApiService,
    ) { }

    // DCS는 언어와 무관하게 동일 결과 반환 (영어 이름만 제공)
    async fetchGameList(useMock: boolean = true): Promise<AggregatorGameDto[]> {
        this.logger.log('Fetching game list from DCS...');

        if (useMock) {
            const response = mockResponse1;
            return this.mapResponseToDto(response.data);
        }

        const result: AggregatorGameDto[] = [];
        const providers = Object.values(DcsMapperService.PROVIDER_MAP);

        // DCS는 Provider별로 게임 목록을 조회해야 함
        await Promise.all(
            providers.map(async (provider) => {
                try {
                    const response = await this.dcsApiService.getGameList({ provider });
                    const dtos = this.mapResponseToDto(response.data);
                    result.push(...dtos);
                } catch (error) {
                    this.logger.error(`Failed to fetch game list for provider ${provider}: ${error.message}`, error.stack);
                    // 하나의 Provider가 실패해도 나머지는 계속 진행
                }
            })
        );

        this.logger.log(`Fetched ${result.length} games from DCS (Real API)`);
        return result;
    }

    private mapResponseToDto(games: any[]): AggregatorGameDto[] {
        return games.map((game) => ({
            // 필수
            providerName: game.content || game.provider, // content가 없으면 provider 코드 사용 (fallback)
            gameName: game.game_name,
            gameCode: game.game_id.toString(),
            // 추가 권장
            providerCode: game.provider, // "png" 등
            category: game.content_type || undefined, // "Standard" 등
            // 선택적
            gameType: game.game_type || undefined, // "5-Reel Slot Machine" 등
            iconUrl: game.game_icon || undefined,
            isEnabled: true, // DCS 게임 리스트에 존재하는 게임은 활성 상태로 간주
        }));
    }
}

