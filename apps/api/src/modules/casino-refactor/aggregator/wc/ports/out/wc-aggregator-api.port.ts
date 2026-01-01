// src/modules/casino-refactor/aggregator/wc/ports/out/wc-aggregator-api.port.ts
import { GameProvider } from '@repo/database';

export interface WcAggregatorApiPort {
  getGameList(params: { provider: GameProvider }): Promise<any>;
}
