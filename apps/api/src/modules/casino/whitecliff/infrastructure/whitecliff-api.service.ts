import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/common/env/env.service';
import { firstValueFrom } from 'rxjs';
import { WhitecliffConfig } from 'src/common/env/env.types';
import axios from 'axios';
import { GameProvider, Language } from '@repo/database';
import { WhitecliffMapperService } from './whitecliff-mapper.service';
import { GamingCurrencyCode } from 'src/utils/currency.util';

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
  private readonly logger = new Logger(WhitecliffApiService.name);
  private readonly whitecliffConfig: WhitecliffConfig[];

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
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
      // category?: string;
    };
  }): Promise<WhitecliffGameLaunchResponse | WhitecliffErrorResponse> {
    try {
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
          type: prd.type || 0, // 0: 라이브 게임, 1: 슬롯/미니게임 (게임사별 게임 번호)
          is_mobile: prd.is_mobile || false,
          table_id: prd.table_id || '',
        },
      };

      this.logger.log(`게임 실행 요청: userId=${user.id}, prdId=${prd.id}`);

      const response = await firstValueFrom(
        this.httpService.post<WhitecliffGameLaunchResponse>(
          `${whitecliffConfig.endpoint}/auth`,
          authData,
          {
            headers: {
              'Content-Type': 'application/json',
              'ag-code': whitecliffConfig.agentCode,
              'ag-token': whitecliffConfig.token,
            },
            timeout: 10000,
          },
        ),
      );

      this.logger.log(
        `게임 실행 성공: userId=${user.id}, status=${response.data.status}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, `게임 실행 실패`);
      return {
        status: 0,
        error: 'API_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    try {
      const whitecliffConfig = this.getConfigByCurrency(gameCurrency);
      const url = `${whitecliffConfig.endpoint}/results/${prdId}/${txnId}`;

      const response = await firstValueFrom(
        this.httpService.get<BetResultsResponse>(url, {
          headers: {
            'Content-Type': 'application/json',
            'ag-code': whitecliffConfig.agentCode,
            'ag-token': whitecliffConfig.token,
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `Bet Results 결과재확인 성공: prdId=${prdId}, txnId=${txnId}, status=${response.data.status}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Bet Results 결과재확인 실패: prdId=${prdId}, txnId=${txnId}, error=${error.message}`,
        error.stack,
      );
      return {
        status: 0,
        error: 'BET_RESULTS_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    try {
      const whitecliffConfig = this.getConfigByCurrency(gameCurrency);
      const url = `${whitecliffConfig.endpoint}/bet/results`;

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

      const response = await firstValueFrom(
        this.httpService.post<TransactionResultsResponse>(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'ag-code': whitecliffConfig.agentCode,
            'ag-token': whitecliffConfig.token,
          },
          timeout: 10000,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `Transaction Results 베팅 정보 조회 실패: txnId=${txn_id}`,
      );
      return {
        status: 0,
        error: 'TRANSACTION_RESULTS_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    try {
      const whitecliffConfig = this.getConfigByCurrency(gameCurrency);
      const url = `${whitecliffConfig.endpoint}/gamelist`;
      this.logger.log(`Product(s) Game List API 호출: ${url}`);

      const body = {
        language,
        prd_id,
      };

      const dedicatedAxios = axios.create();

      const response = await dedicatedAxios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'ag-code': whitecliffConfig.agentCode,
          'ag-token': whitecliffConfig.token,
        },
      });

      // 🎯 응답 크기 진단
      const jsonStr = JSON.stringify(response.data);
      const responseSize = Buffer.byteLength(jsonStr, 'utf8');
      this.logger.log(
        `직접 Axios - 응답 크기: ${this.formatBytes(responseSize)}, 게임 수: ${Object.keys(response.data?.game_list ?? {}).length}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, `Product(s) Game List API 실패`);
      return {
        status: 0,
        error: 'PRODUCT_GAME_LIST_REQUEST_FAILED',
        message: error.message,
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const whitecliffConfig = this.getConfigByCurrency(gameCurrency);
    const url = `${whitecliffConfig.endpoint}/getpushbets`;
    const body = {
      prd_id,
      start_date,
      end_date,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<PushedBetHistoryResponse>(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'ag-code': whitecliffConfig.agentCode,
            'ag-token': whitecliffConfig.token,
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `Pushed Bet History API 성공: status=${response.data?.status}, 데이터=${JSON.stringify(response.data?.data ?? {})}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(error, `Pushed Bet History API 실패`);
      return {
        status: 0,
        error: 'PUSHED_BET_HISTORY_REQUEST_FAILED',
        message: error.message,
      };
    }
  }
}
