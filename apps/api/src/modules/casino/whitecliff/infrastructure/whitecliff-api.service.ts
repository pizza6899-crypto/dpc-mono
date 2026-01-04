import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/common/env/env.service';
import { firstValueFrom } from 'rxjs';
import { WhitecliffConfig } from 'src/common/env/env.types';

import { GameProvider, Language } from '@repo/database';
import { WhitecliffMapperService } from './whitecliff-mapper.service';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

// 공통 에러 응답 타입 정의
interface WhitecliffErrorResponse {
  status: number;
  error: string;
  message?: string;
}

// 게임 실행 응답 타입
export interface WhitecliffGameLaunchResponse {
  status: number;
  user_id: number;
  username: string;
  launch_url: string;
  sid: string;
  error: string;
}

// 베팅 결과 응답 타입
interface BetResultsResponse {
  status: number;
  type: number;
  game_id: number;
  stake: number;
  payout: number;
  is_cancel: number;
  credit_time: string;
  error: string;
}

// 트랜잭션 결과 응답 타입
export interface TransactionResultsResponse {
  status: number;
  url: string;
  error?: string;
}

// 게임 리스트 응답 타입
export interface ProductGameListResponse {
  status: number;
  game_list: {
    [prd_id: string]: {
      prd_name: string;
      prd_category: string;
      game_id: number;
      game_name: string;
      table_id?: string | null; // null 추가
      game_type?: string | null; // null 추가
      game_icon_link?: string | null; // null 추가
      game_icon_link_sq?: string; // 추가 (일부 게임에만 있음)
      is_enabled: number;
    }[];
  };
  error?: string;
}

// 푸시 베팅 내역 응답 타입
export interface PushedBetHistoryResponse {
  status: string;
  data?: {
    txn_id: string;
    total_pushed_amt: number;
    tie_amt: number;
  }[];
  error?: string;
}

@Injectable()
export class WhitecliffApiService {
  private readonly whitecliffConfig: WhitecliffConfig[];

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {
    this.whitecliffConfig = this.envService.whitecliff;
  }

  /**
   * 지정한 Currency에 해당하는 WhitecliffConfig를 반환합니다.
   * @param currency 조회할 통화 코드 (예: 'USDT', 'USD' 등)
   * @returns 일치하는 WhitecliffConfig가 있으면 반환, 없으면 첫 번째 config를 반환합니다.
   */
  private getConfigByCurrency(
    gameCurrency: GamingCurrencyCode,
  ): WhitecliffConfig {
    const searchCurrency =
      this.whitecliffMapperService.convertGamingCurrencyToWhitecliffCurrency(
        gameCurrency,
      );

    const matchedConfig = this.whitecliffConfig.find(
      (config) => config.currency === searchCurrency,
    );

    if (matchedConfig) {
      return matchedConfig;
    }

    return this.whitecliffConfig[0];
  }

  private async request<T>(
    currency: GamingCurrencyCode,
    method: 'GET' | 'POST',
    path: string,
    data?: any,
    description?: string, // 로깅용 설명
  ): Promise<T | WhitecliffErrorResponse> {
    const config = this.getConfigByCurrency(currency);
    const url = `${config.endpoint}${path}`;

    const startTime = Date.now();
    let responseData: any;
    let errorObj: any;
    let success = false;
    let statusCode = 0;

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url,
          data,
          headers: {
            'Content-Type': 'application/json',
            'ag-code': config.agentCode,
            'ag-token': config.token,
          },
          timeout: 10000,
        }),
      );

      responseData = response.data;
      statusCode = response.status;
      success = true;

      return response.data;
    } catch (error) {
      errorObj = error;
      statusCode = error.response?.status || 0;
      success = false;

      return {
        status: 0,
        error: 'API_REQUEST_FAILED',
        message: error.message,
      };
    } finally {
      const duration = Date.now() - startTime;
      await this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'WHITECLIFF',
          method,
          endpoint: url,
          statusCode,
          duration,
          success,
          request: data,
          response: responseData || (errorObj ? { message: errorObj.message } : null),
          metadata: { description },
        },
      });

      if (!success) {
        await this.dispatchLogService.dispatch({
          type: LogType.ERROR,
          data: {
            severity: 'ERROR',
            errorCode: 'WHITECLIFF_API_ERROR',
            errorMessage: errorObj?.message || 'Unknown error',
            stackTrace: errorObj?.stack,
            path: url,
            method,
          },
        });
      }
    }
  }

  /**
   * 게임 실행 (회원가입 겸용)
   */
  async launchGame({
    user,
    prd,
  }: {
    user: {
      id: number;
      name: string;
      balance: number;
      language: Language;
      gameCurrency: GamingCurrencyCode;
      token: string;
    };
    prd: {
      id: number;
      type?: number;
      is_mobile?: boolean;
      table_id?: string;
    };
  }): Promise<WhitecliffGameLaunchResponse | WhitecliffErrorResponse> {
    const whitecliffConfig = this.getConfigByCurrency(user.gameCurrency);
    const authData = {
      user: {
        id: user.id,
        name: user.name,
        balance: user.balance,
        language: user.language || 'en',
        sid: user.token || '',
        currency: whitecliffConfig.currency,
        home_url: whitecliffConfig.redirectHomeUrl,
      },
      prd: {
        id: prd.id,
        type: prd.type || 0,
        is_mobile: prd.is_mobile || false,
        table_id: prd.table_id || '',
      },
    };

    return this.request<WhitecliffGameLaunchResponse>(
      user.gameCurrency,
      'POST',
      '/auth',
      authData,
      `게임 실행 (userId=${user.id})`,
    );
  }

  /**
   * Bet Results 결과재확인
   * WHITECLIFF에서 특정 베팅 결과를 재확인하는 API를 호출합니다.
   * @param prdId 게임 상품 ID
   * @param txnId 트랜잭션 ID
   * @returns 베팅 결과 데이터 또는 에러 정보
   */
  async getBetResults(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
    txnId: string,
  ): Promise<BetResultsResponse | WhitecliffErrorResponse> {
    return this.request<BetResultsResponse>(
      gameCurrency,
      'GET',
      `/results/${prdId}/${txnId}`,
      undefined,
      `Bet Results 결과재확인 (txnId=${txnId})`,
    );
  }

  /**
   * Transaction Results 베팅 정보 조회
   * WHITECLIFF에서 특정 베팅의 상세 정보를 조회하는 API를 호출합니다.
   * @param txnId 트랜잭션 ID
   * @param roundId (선택) 라운드 ID
   * @returns 베팅 정보 데이터 또는 에러 정보
   */
  async getTransactionResults({
    gameCurrency,
    lang,
    provider,
    txn_id,
  }: {
    gameCurrency: GamingCurrencyCode;
    lang: Language;
    provider: GameProvider;
    txn_id: string;
  }): Promise<TransactionResultsResponse | WhitecliffErrorResponse> {
    // 기본적으로 맵핑을 통해서 enum -> int 변경
    let prd_id = this.whitecliffMapperService.toWhitecliffProvider(provider);

    // 에볼루션인 경우 currency에 따라 다르게 응답
    if (provider === GameProvider.EVOLUTION) {
      switch (gameCurrency) {
        case 'KRW':
          prd_id = 31;
          break;
        case 'IDR':
          prd_id = 29;
          break;
        default:
          prd_id = 1;
          break;
      }
    }

    const body: any = {
      lang,
      prd_id,
      txn_id,
    };

    return this.request<TransactionResultsResponse>(
      gameCurrency,
      'POST',
      '/bet/results',
      body,
      `Transaction Results 베팅 정보 조회 (txnId=${txn_id})`,
    );
  }

  /**
   * Product(s) Game List - 게임리스트 조회
   * WHITECLIFF에서 서비스 중인 게임 목록을 조회합니다.
   *
   * @returns 게임 리스트 API 응답
   */
  async getProductGameList({
    gameCurrency,
    language,
    prd_id,
  }: {
    gameCurrency: GamingCurrencyCode;
    language: Language;
    prd_id?: number;
  }): Promise<ProductGameListResponse | WhitecliffErrorResponse> {
    // 🎯 중앙 request 메서드 이용
    const result = await this.request<ProductGameListResponse>(
      gameCurrency,
      'POST',
      '/gamelist',
      { language, prd_id },
      'Product(s) Game List API',
    );

    // 에러 응답인 경우 (request 메서드에서 { status: 0, error: ... } 반환)
    // WhitecliffErrorResponse는 status, error 필드를 가짐
    if ('error' in result && result.status === 0) {
      return result;
    }

    // 성공한 경우 (데이터 타입이 ProductGameListResponse)
    // 응답 크기 진단
    // 성공한 경우 (데이터 타입이 ProductGameListResponse)
    // 응답 크기 진단 (생략 - Audit Log 확인)

    return result;
  }



  /**
   * 푸시 베팅 내역 조회 (Pushed Bet History)
   * Evolution Live Casino - Baccarat 및 Blackjack 전용
   * @param params { txn_id?: string; round_id?: string }
   * @returns 푸시 베팅 내역 결과
   */
  async getPushedBetHistory({
    gameCurrency,
    prd_id,
    start_date,
    end_date,
  }: {
    gameCurrency: GamingCurrencyCode;
    prd_id: number;
    start_date: string;
    end_date: string;
  }): Promise<PushedBetHistoryResponse | WhitecliffErrorResponse> {
    return this.request<PushedBetHistoryResponse>(
      gameCurrency,
      'POST',
      '/getpushbets',
      { prd_id, start_date, end_date },
      'Pushed Bet History API',
    );
  }
}
