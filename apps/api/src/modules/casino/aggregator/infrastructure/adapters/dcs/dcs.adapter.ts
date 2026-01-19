import { Injectable, Logger } from '@nestjs/common';
import { AggregatorClientPort } from '../../../ports/aggregator.client.port';
import { AggregatorGameDto } from '../../../ports/aggregator-game.dto';

@Injectable()
export class DcsAdapter implements AggregatorClientPort {
    private readonly logger = new Logger(DcsAdapter.name);

    async fetchGameList(): Promise<AggregatorGameDto[]> {
        this.logger.log('Fetching game list from DCS...');
        // TODO: Implement actual DCS API call
        return [];
    }
}
