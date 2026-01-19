import { Injectable } from '@nestjs/common';
import { GameAggregatorType } from '@repo/database';
import { AggregatorClientPort } from '../ports/aggregator.client.port';
import { WhitecliffAdapter } from './adapters/whitecliff/whitecliff.adapter';
import { DcsAdapter } from './adapters/dcs/dcs.adapter';

@Injectable()
export class AggregatorClientFactory {
    constructor(
        private readonly whitecliffAdapter: WhitecliffAdapter,
        private readonly dcsAdapter: DcsAdapter,
    ) { }

    getClient(type: GameAggregatorType): AggregatorClientPort {
        switch (type) {
            case GameAggregatorType.WHITECLIFF:
                return this.whitecliffAdapter;
            case GameAggregatorType.DCS:
                return this.dcsAdapter;
            default:
                throw new Error(`Unsupported aggregator type: ${type}`);
        }
    }
}
