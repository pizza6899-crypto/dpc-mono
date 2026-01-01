// src/modules/casino-refactor/aggregator/wc/infrastructure/wc-aggregator-api.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/common/env/env.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { firstValueFrom } from 'rxjs';
import { WhitecliffConfig } from 'src/common/env/env.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { HttpStatusCode } from 'axios';
import { GameProvider, Language } from '@repo/database';
import { WcMapperService } from './wc-mapper.service';
import type { WcAggregatorApiPort } from '../ports/out/wc-aggregator-api.port';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import { mockResponse2 } from './mock2';

/**
 * WC Aggregator API Adapter
 *
 * Whitecliff 애그리게이터 API와의 통신을 담당하는 어댑터입니다.
 * 필요한 메서드만 구현합니다.
 */
@Injectable()
export class WcAggregatorApiAdapter implements WcAggregatorApiPort {
  private readonly logger = new Logger(WcAggregatorApiAdapter.name);
  private readonly whitecliffConfig: WhitecliffConfig[];

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly wcMapperService: WcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {
    this.whitecliffConfig = this.envService.whitecliff;
  }

  /**
   * API 호출 전 체크 메서드
   */
  private checkApiAvailability(): void {
    if (!this.whitecliffConfig || this.whitecliffConfig.length === 0) {
      this.logger.error('WC API 설정이 없습니다.');
      throw new Error('WC API config is not available');
    }

    const hasEnabledConfig = this.whitecliffConfig.some(
      (config) => config.apiEnabled,
    );
    if (!hasEnabledConfig) {
      this.logger.error('WC API 송신이 비활성화되어 있습니다.');
      throw new Error('WC API is disabled');
    }
  }

  /**
   * Currency에 해당하는 WhitecliffConfig 반환
   */
  private getConfigByCurrency(
    gameCurrency: GamingCurrencyCode,
  ): WhitecliffConfig {
    const searchCurrency =
      this.wcMapperService.toWcCurrency(gameCurrency);

    const matchedConfig = this.whitecliffConfig.find(
      (config) => config.currency === searchCurrency,
    );

    if (matchedConfig) {
      return matchedConfig;
    }

    // 일치하는 currency가 없으면 첫 번째 config 반환
    return this.whitecliffConfig[0];
  }

  /**
   * 게임 목록 조회
   * TODO: 테스트용으로 mock 데이터 반환 중. 실제 API 연동 시 주석 해제 필요
   */
  async getGameList({ provider }: { provider: GameProvider }) {
    const startTime = Date.now();
    const endpoint = '/gamelist';

    const prd_id = this.wcMapperService.toWcProvider(provider);

    const body = {
      language: Language.EN,
      prd_id,
    };

    try {
      // Mock 데이터 사용 (임시)
      const mockData = mockResponse2;

      const duration = Date.now() - startTime;

      // API audit 로그 저장 (성공)
      this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'WHITECLIFF',
          method: 'POST',
          endpoint,
          statusCode: 200, // Mock 응답이므로 200으로 가정
          duration,
          success: true,
          requestBody: body,
          responseBody: mockData,
        },
      });

      return mockData;

      // 실제 API 호출 로직 (주석 처리)
      // this.checkApiAvailability();
      //
      // // 기본 통화로 설정 조회 (USDT 사용)
      // const config = this.getConfigByCurrency('USDT');
      // const url = `${config.endpoint}${endpoint}`;
      //
      // const response = await firstValueFrom(
      //   this.httpService.post<{
      //     status: number;
      //     game_list: {
      //       [prd_id: string]: {
      //         prd_name: string;
      //         prd_category: string;
      //         game_id: number;
      //         game_name: string;
      //         table_id?: string | null;
      //         game_type?: string | null;
      //         game_icon_link?: string | null;
      //         game_icon_link_sq?: string;
      //         is_enabled: number;
      //       }[];
      //     };
      //     error?: string;
      //   }>(url, body, {
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'ag-code': config.agentCode,
      //       'ag-token': config.token,
      //     },
      //     timeout: 10000,
      //   }),
      // );
      //
      // const duration = Date.now() - startTime;
      //
      // // API audit 로그 저장 (성공)
      // this.dispatchLogService.dispatch({
      //   type: LogType.INTEGRATION,
      //   data: {
      //     provider: 'WHITECLIFF',
      //     method: 'POST',
      //     endpoint,
      //     statusCode: response.status,
      //     duration,
      //     success: true,
      //     requestBody: body,
      //     responseBody: response.data,
      //   },
      // });
      //
      // return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logger.error(
        error,
        `게임 목록 조회 실패: provider=${provider}`,
      );

      // API audit 로그 저장 (실패)
      this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'WHITECLIFF',
          method: 'POST',
          endpoint,
          statusCode: error.response?.status || 500, // Mock 에러이므로 500으로 가정
          duration,
          success: false,
          requestBody: body,
          responseBody: error.response?.data || null,
          errorMessage: error.message || 'Unknown error',
        },
      });

      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
  }
}

