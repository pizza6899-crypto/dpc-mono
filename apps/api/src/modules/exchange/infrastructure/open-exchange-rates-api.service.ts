// src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvService } from 'src/common/env/env.service';

export interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number; // Unix timestamp
  base: string; // 기본적으로 "USD"
  rates: Record<string, number>; // { "KRW": 1300, "JPY": 150, ... }
}

@Injectable()
export class OpenExchangeRatesApiService {
  private readonly logger = new Logger(OpenExchangeRatesApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
  ) {}

  /**
   * 최신 환율 조회 (USD 기준)
   * @returns { rates: { KRW: 1300, JPY: 150, ... }, base: "USD", timestamp: ... }
   */
  async getLatestRates(): Promise<OpenExchangeRatesResponse> {
    const config = this.envService.openExchangeRates;

    if (!config.enabled) {
      throw new Error('Open Exchange Rates is not enabled');
    }

    if (!config.appKey) {
      throw new Error('Open Exchange Rates app key is missing');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesResponse>(
          `${config.apiUrl}/latest.json`,
          {
            params: {
              app_id: config.appKey,
            },
            timeout: 30000,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, 'Open Exchange Rates API 호출 실패');
      throw error;
    }
  }
}
