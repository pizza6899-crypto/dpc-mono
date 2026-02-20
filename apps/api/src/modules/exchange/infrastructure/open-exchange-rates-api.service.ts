// src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvService } from 'src/common/env/env.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

export interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number; // Unix timestamp
  base: string; // 기본적으로 "USD"
  rates: Record<string, number>; // { "KRW": 1300, "JPY": 150, ... }
}

@Injectable()
export class OpenExchangeRatesApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly dispatchLogService: DispatchLogService,
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

    const endpoint = `${config.apiUrl}/latest.json`;
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesResponse>(endpoint, {
          params: {
            app_id: config.appKey,
          },
          timeout: 30000,
        }),
      );

      const duration = Date.now() - startTime;

      this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'OPEN_EXCHANGE_RATES',
          method: 'GET',
          endpoint,
          duration,
          success: true,
          statusCode: response.status,
          response: response.data,
        },
      });

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'OPEN_EXCHANGE_RATES',
          method: 'GET',
          endpoint,
          duration,
          success: false,
          statusCode: error.response?.status || 500,
          metadata: { errorMessage: error.message },
        },
      });

      this.dispatchLogService.dispatch({
        type: LogType.ERROR,
        data: {
          severity: 'ERROR',
          errorMessage: 'Open Exchange Rates API 호출 실패',
          stackTrace: error instanceof Error ? error.stack : undefined,
        },
      });
      throw error;
    }
  }
}
