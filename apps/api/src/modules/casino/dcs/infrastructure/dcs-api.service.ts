// src/modules/casino/dcs/infrastructure/dcs-api.service.ts

import { Injectable, Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/common/env/env.service';
import { firstValueFrom } from 'rxjs';
import { DcsConfig } from 'src/common/env/env.types';
import * as crypto from 'crypto';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { HttpStatusCode } from 'axios';
import { GameProvider } from '@repo/database';
import { DcsMapperService } from './dcs-mapper.service';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { DcsResponseCode } from '../constants/dcs-response-codes';

@Injectable()
export class DcsApiService {
  private readonly dcsConfig: DcsConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly dcsMapperService: DcsMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {
    this.dcsConfig = this.envService.dcs;
  }

  /**
   * API 호출 전 체크 메서드
   */
  private checkApiAvailability(): void {
    if (!this.dcsConfig.apiEnabled) {
      throw new Error('DCS API 송신이 비활성화되어 있습니다.');
    }
  }

  /**
   * Sign 생성 함수
   * Sign = MD5(brand_id + brand_uid + api_key + ...추가 파라미터들)
   * @param brandUid 브랜드 사용자 ID (user_id 등)
   * @param additionalParams 추가 파라미터들 (가변적)
   * @returns MD5 해시된 sign 값
   */
  private generateSign(...params: (string | number | undefined)[]): string {
    const baseString =
      this.dcsConfig.brandId +
      params
        .filter((param) => param !== undefined && param !== null)
        .map((param) => String(param))
        .join('') +
      this.dcsConfig.apiKey;

    return crypto
      .createHash('md5')
      .update(baseString)
      .digest('hex')
      .toUpperCase();
  }

  private async request<T>(
    url: string,
    body: any,
    description: string,
    errorType: string = 'API_REQUEST_FAILED',
  ): Promise<T> {
    this.checkApiAvailability();

    const startTime = Date.now();
    let responseData: any;
    let errorObj: any;
    let success = false;
    let statusCode = 0;

    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(url, body, {
          headers: {
            'Content-Type': 'application/json',
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

      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    } finally {
      const duration = Date.now() - startTime;
      await this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'DCS',
          method: 'POST',
          endpoint: url,
          statusCode,
          duration,
          success,
          request: body,
          response: responseData || (errorObj ? { message: errorObj.message } : null),
          metadata: { description },
        },
      });

      if (!success) {
        await this.dispatchLogService.dispatch({
          type: LogType.ERROR,
          data: {
            severity: 'ERROR',
            errorCode: errorType,
            errorMessage: errorObj?.message || 'Unknown error',
            stackTrace: errorObj?.stack,
            path: url,
            method: 'POST',
            // SystemErrorLogPayload does not have metadata.
            // We can put provider info in path or message if needed, but endpoint is already in path.
            // Additional info can be logged via side channels or strictly adhering to SystemErrorLogPayload.
            // For now, removing metadata to fix lint.
          },
        });
      }
    }
  }

  /**
   * 게임 로그인
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @param language 언어
   * @param currency 통화
   * @returns 게임 로그인 응답 데이터
   */
  async loginGame({
    dcsUserId,
    dcsUserToken,
    gameId,
    gameCurrency,
    language,
    country_code,
    channel,
    full_screen,
    return_url,
  }: {
    dcsUserId: string;
    dcsUserToken: string;
    gameId: number;
    gameCurrency: GamingCurrencyCode;
    language: string;
    channel: string;
    country_code: string;
    return_url?: string;
    full_screen?: boolean;
  }) {
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.apiUrl}/dcs/loginGame`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(dcsUserId),
      brand_uid: dcsUserId,
      token: dcsUserToken,
      game_id: gameId,
      language: language,
      currency: dcsCurrency,
      channel: channel,
      country_code,
    };

    const result = await this.request<{
      code: number;
      msg: string;
      data: {
        game_url: string;
      };
    }>(
      url,
      body,
      `게임 로그인 (dcsUserId=${dcsUserId}, gameId=${gameId})`,
      'LOGIN_GAME_FAILED',
    );

    if (result.code !== DcsResponseCode.SUCCESS) {
      // 기존 로직: 에러 발생시 ApiException throw
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }

    return result;
  }

  /**
   * 게임 체험 (Try Game)
   * @param gameId 게임 ID
   * @param language 언어
   * @param currency 통화
   * @returns 게임 체험 응답 데이터
   */
  async tryGame({
    gameId,
    language,
    gameCurrency,
    channel,
    return_url,
    full_screen,
  }: {
    gameId: number;
    gameCurrency: GamingCurrencyCode;
    language: string;
    channel: string;
    return_url?: string;
    full_screen?: boolean;
  }) {
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.apiUrl}/dcs/tryGame`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(gameId),
      game_id: gameId,
      currency: dcsCurrency,
      language,
      channel,
      return_url,
      full_screen,
    };

    const result = await this.request<{
      code: number;
      msg: string;
      data: {
        game_url: string;
      };
    }>(url, body, `게임 체험 (gameId=${gameId})`, 'TRY_GAME_FAILED');

    if (result.code !== DcsResponseCode.SUCCESS) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }

    return result;
  }

  /**
   /**
    * 베팅 데이터 조회
    * @param page 페이지 번호
    * @param start_time 조회 시작 시간 (YYYY-MM-DD HH:mm:ss)
    * @param end_time 조회 종료 시간 (YYYY-MM-DD HH:mm:ss)
    * @param currency 통화
    * @param provider 게임 제공사 코드
    * @param brand_uid 브랜드 고유 ID
    * @returns 베팅 데이터 또는 에러 정보 반환
    */
  async getBetData({
    page,
    start_time,
    end_time,
    gameCurrency,
    provider,
    brand_uid,
  }: {
    page: number;
    start_time: string;
    end_time: string;
    gameCurrency: GamingCurrencyCode;
    provider: string;
    brand_uid: string;
  }) {
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.getBetDataUrl}/dcs/getBetData`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(start_time, end_time),
      page,
      start_time,
      end_time,
      currency: dcsCurrency,
      provider,
      brand_uid,
    };

    return this.request<{
      code: number;
      msg: string;
      data: {
        brand_uid: string;
        currency: string;
        wager_type: string;
        amount: number;
        before_amount: number;
        after_amount: number;
        game_id: number;
        game_name: string;
        round_id: string;
        wager_id: string;
        jackpot_contribution: number;
        jackpot_win: number;
        description: string;
        create_time: string;
        game_result: {};
        tip: number;
        is_endround: boolean;
      }[];
      page: {
        current_page: number;
        total_pages: number;
      };
    }>(
      url,
      body,
      `베팅 데이터 조회 (page=${page}, range=${start_time}~${end_time})`,
      'BET_DATA_REQUEST_FAILED',
    );
  }

  /**
   * 게임 리플레이 조회
   * @param betId 베팅 ID
   * @param roundId 라운드 ID (선택)
   * @returns 리플레이 데이터 또는 에러 정보
   */
  async getReplay({
    brand_uid,
    gameCurrency,
    provider,
    round_id,
  }: {
    brand_uid: string;
    gameCurrency: GamingCurrencyCode;
    provider: GameProvider;
    round_id: string;
  }) {
    const dcsProvider = this.dcsMapperService.toDcsProvider(provider);
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.apiUrl}/dcs/getReplay`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(round_id),
      brand_uid,
      currency: dcsCurrency,
      provider: dcsProvider,
      round_id,
    };

    const result = await this.request<{
      code: number;
      msg: string;
      data: {
        record: string;
        record_type: 'Text' | 'URL' | 'Html';
      };
    }>(
      url,
      body,
      `게임 리플레이 조회 (round_id=${round_id})`,
      'GET_REPLAY_FAILED',
    );

    if (result.code !== DcsResponseCode.SUCCESS) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
    return result;
  }

  /**
   * 게임 목록 조회
   * @param language 언어 (선택)
   * @param category 카테고리 (선택)
   * @returns 게임 목록 데이터 또는 에러 정보
   */
  async getGameList({ provider }: { provider: GameProvider }) {
    const url = `${this.dcsConfig.apiUrl}/dcs/getGameList`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(),
      provider: this.dcsMapperService.toDcsProvider(provider),
    };

    const result = await this.request<{
      code: number;
      msg: string;
      data: {
        provider: string;
        game_id: number;
        game_name: string;
        game_name_cn: string;
        release_date: string;
        rtp: string;
        game_icon: string;
        content_type: string;
        game_type: string;
        content: string;
      }[];
    }>(url, body, `게임 목록 조회`, 'GET_GAME_LIST_FAILED');

    if (result.code !== DcsResponseCode.SUCCESS) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
    return result;
  }

  /**
   * 무료 스핀 생성
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @param freeSpinCount 무료 스핀 개수
   * @param expiresAt 만료 시간 (선택)
   * @returns 무료 스핀 생성 응답 데이터
   */
  async createFreeSpin({
    game_id,
    gameCurrency,
    end_time,
    description,
  }: {
    game_id: number;
    gameCurrency: GamingCurrencyCode;
    end_time: string;
    description?: string;
  }) {
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.apiUrl}/dcs/createFreeSpin`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(end_time),
      game_id,
      currency: dcsCurrency,
      end_time,
      description,
    };

    return this.request<{
      code: number;
      msg: string;
      data: {
        freespin_id: number;
        usable_amounts: number[];
      };
    }>(
      url,
      body,
      `무료 스핀 생성 (game_id=${game_id}, end_time=${end_time})`,
      'CREATE_FREE_SPIN_REQUEST_FAILED',
    );
  }

  /**
   * 무료 스핀 추가
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @param freeSpinCount 추가할 무료 스핀 개수
   * @returns 무료 스핀 추가 응답 데이터
   */
  async addFreeSpin({
    freespin_id,
    round_count,
    amount,
    brand_uids,
  }: {
    freespin_id: number; // long 타입
    round_count: number;
    amount: number; // Decimal(16,6)
    brand_uids: string[];
  }) {
    const url = `${this.dcsConfig.apiUrl}/dcs/addFreeSpin`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(freespin_id),
      freespin_id,
      round_count,
      amount,
      brand_uids,
    };

    return this.request<{
      code: number;
      msg: string;
      data: {
        result: string;
      };
    }>(
      url,
      body,
      `무료 스핀 추가 (id=${freespin_id}, count=${round_count})`,
      'ADD_FREE_SPIN_REQUEST_FAILED',
    );
  }

  /**
   * 무료 스핀 조회
   * @param userId 사용자 ID
   * @param gameId 게임 ID (선택)
   * @returns 무료 스핀 조회 응답 데이터
   */
  async queryFreeSpin({
    game_id,
    gameCurrency,
    freespin_id,
    brand_uid,
    start_after,
    end_before,
  }: {
    game_id: number;
    gameCurrency: GamingCurrencyCode;
    freespin_id: number;
    brand_uid: string;
    start_after: string;
    end_before: string;
  }) {
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    const url = `${this.dcsConfig.apiUrl}/dcs/queryFreeSpin`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(game_id),
      game_id,
      currency: dcsCurrency,
      freespin_id,
      brand_uid,
      start_after,
      end_before,
    };

    return this.request<{
      code: number;
      msg: string;
      data: {
        freespin_id: number;
        start_time: string;
        end_time: string;
        provider: string;
        game_id: number;
        currency: string;
        status: number;
        round_count: number;
        amount: number;
        brand_uids: string[];
        create_time: string;
      }[];
    }>(
      url,
      body,
      `무료 스핀 조회 (id=${freespin_id}, range=${start_after}~${end_before})`,
      'QUERY_FREE_SPIN_REQUEST_FAILED',
    );
  }

  /**
   * 사용자 베팅 요약 조회
   * @param userId 사용자 ID
   * @param startDate 시작 날짜 (선택)
   * @param endDate 종료 날짜 (선택)
   * @returns 사용자 베팅 요약 데이터 또는 에러 정보
   */
  async getUsersBetSummary({
    page,
    date,
    provider,
    brand_uid,
  }: {
    page: number;
    date: string;
    provider: string;
    brand_uid: string;
  }) {
    const url = `${this.dcsConfig.getBetDataUrl}/dcs/getUsersBetSummary`;
    const body = {
      brand_id: this.dcsConfig.brandId,
      sign: this.generateSign(page, date, provider, brand_uid),
      page,
      date,
      provider,
      brand_uid,
    };

    return this.request<{
      code: number;
      msg: string;
      data: {
        brand_uid: string;
        currency: string;
        provider: string;
        bet_type: string;
        bet_count: number;
        bet_amt: number;
        win_amt: number;
        jackpot_contribution: number;
        jackpot_win: number;
        tip: number;
      }[];
      page: {
        current_page: number;
        total_count: number;
      };
    }>(
      url,
      body,
      `사용자 베팅 요약 조회 (page=${page}, date=${date})`,
      'GET_USERS_BET_SUMMARY_REQUEST_FAILED',
    );
  }
}
