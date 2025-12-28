// src/modules/casino/dcs/infrastructure/dcs-api.service.ts

import { Injectable, Logger, Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/platform/env/env.service';
import { firstValueFrom } from 'rxjs';
import { DcsConfig } from 'src/platform/env/env.types';
import * as crypto from 'crypto';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import { HttpStatusCode } from 'axios';
import { GameProvider } from '@repo/database';
import { DcsMapperService } from './dcs-mapper.service';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class DcsApiService {
  private readonly logger = new Logger(DcsApiService.name);
  private readonly dcsConfig: DcsConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly dcsMapperService: DcsMapperService,
  ) {
    this.dcsConfig = this.envService.dcs;
  }

  /**
   * API 호출 전 체크 메서드
   */
  private checkApiAvailability(): void {
    if (!this.dcsConfig.apiEnabled) {
      this.logger.error('DCS API 송신이 비활성화되어 있습니다.');
      throw new Error();
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
    this.checkApiAvailability();
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
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

      this.logger.log(
        `게임 로그인 요청: dcsUserId=${dcsUserId}, gameId=${gameId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<{
          code: number;
          msg: string;
          data: {
            game_url: string;
          };
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `게임 로그인 성공: dcsUserId=${dcsUserId}, status=${response.data.code}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `게임 로그인 실패: dcsUserId=${dcsUserId}, gameId=${gameId}, currency=${gameCurrency}, language=${language}`,
      );
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
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
    this.checkApiAvailability();
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
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

      this.logger.log(`게임 체험 요청: gameId=${gameId}`);

      const response = await firstValueFrom(
        this.httpService.post<{
          code: number;
          msg: string;
          data: {
            game_url: string;
          };
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `게임 체험 성공: gameId=${gameId}, status=${response.data.code}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, `게임 체험 실패: gameId=${gameId}`);
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
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
    this.checkApiAvailability();
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
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

      const response = await firstValueFrom(
        this.httpService.post<{
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
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `베팅 데이터 조회 성공: page=${page}, start_time=${start_time}, end_time=${end_time}, currency=${gameCurrency}, provider=${provider}, brand_uid=${brand_uid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `베팅 데이터 조회 실패: page=${page}, start_time=${start_time}, end_time=${end_time}, currency=${gameCurrency}, provider=${provider}, brand_uid=${brand_uid}`,
      );
      return {
        status: 0,
        error: 'BET_DATA_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    this.checkApiAvailability();

    const dcsProvider = this.dcsMapperService.toDcsProvider(provider);
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
      const url = `${this.dcsConfig.apiUrl}/dcs/getReplay`;
      const body = {
        brand_id: this.dcsConfig.brandId,
        sign: this.generateSign(round_id),
        brand_uid,
        currency: dcsCurrency,
        provider: dcsProvider,
        round_id,
      };

      const response = await firstValueFrom(
        this.httpService.post<{
          code: number;
          msg: string;
          data: {
            record: string;
            record_type: 'Text' | 'URL' | 'Html';
          };
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `게임 리플레이 조회 성공: brand_uid=${brand_uid}, currency=${gameCurrency}, provider=${provider}, round_id=${round_id}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `게임 리플레이 조회 실패: brand_uid=${brand_uid}, currency=${gameCurrency}, provider=${provider}, round_id=${round_id}`,
      );
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
  }

  /**
   * 게임 목록 조회
   * @param language 언어 (선택)
   * @param category 카테고리 (선택)
   * @returns 게임 목록 데이터 또는 에러 정보
   */
  async getGameList({ provider }: { provider: GameProvider }) {
    this.checkApiAvailability();

    try {
      const url = `${this.dcsConfig.apiUrl}/dcs/getGameList`;

      const body = {
        brand_id: this.dcsConfig.brandId,
        sign: this.generateSign(),
        provider: this.dcsMapperService.toDcsProvider(provider),
      };

      const response = await firstValueFrom(
        this.httpService.post<{
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
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );
      this.logger.log(`게임 목록 조회 성공: status=${response.data.code}`);

      return response.data;
    } catch (error) {
      this.logger.error(error, `게임 목록 조회 실패`);
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }
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
    this.checkApiAvailability();
    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
      const url = `${this.dcsConfig.apiUrl}/dcs/createFreeSpin`;
      const body = {
        brand_id: this.dcsConfig.brandId,
        sign: this.generateSign(end_time),
        game_id,
        currency: dcsCurrency,
        end_time,
        description,
      };

      this.logger.log(
        `무료 스핀 생성 요청: game_id=${game_id}, currency=${gameCurrency}, end_time=${end_time}, description=${description}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<{
          code: number;
          msg: string;
          data: {
            freespin_id: number;
            usable_amounts: number[];
          };
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `무료 스핀 생성 성공: game_id=${game_id}, currency=${gameCurrency}, end_time=${end_time}, description=${description}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `무료 스핀 생성 실패: game_id=${game_id}, currency=${gameCurrency}, end_time=${end_time}, description=${description}`,
      );
      return {
        status: 0,
        error: 'CREATE_FREE_SPIN_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    this.checkApiAvailability();

    try {
      const url = `${this.dcsConfig.apiUrl}/dcs/addFreeSpin`;
      const body = {
        brand_id: this.dcsConfig.brandId,
        sign: this.generateSign(freespin_id),
        freespin_id,
        round_count,
        amount,
        brand_uids,
      };

      this.logger.log(
        `무료 스핀 추가 요청: freespin_id=${freespin_id}, round_count=${round_count}, amount=${amount}, brand_uids=${brand_uids}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<{
          code: number;
          msg: string;
          data: {
            result: string;
          };
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `무료 스핀 추가 성공: freespin_id=${freespin_id}, round_count=${round_count}, amount=${amount}, brand_uids=${brand_uids}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `무료 스핀 추가 실패: freespin_id=${freespin_id}, round_count=${round_count}, amount=${amount}, brand_uids=${brand_uids}`,
      );
      return {
        status: 0,
        error: 'ADD_FREE_SPIN_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    this.checkApiAvailability();

    const dcsCurrency =
      this.dcsMapperService.convertGamingCurrencyToDcsCurrency(gameCurrency);

    try {
      const url = `${this.dcsConfig.apiUrl}/dcs/queryFreeSpin`;

      this.logger.log(
        `무료 스핀 조회 요청: game_id=${game_id}, currency=${gameCurrency}, freespin_id=${freespin_id}, brand_uid=${brand_uid}, start_after=${start_after}, end_before=${end_before}`,
      );

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

      const response = await firstValueFrom(
        this.httpService.post<{
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
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `무료 스핀 조회 성공: game_id=${game_id}, currency=${gameCurrency}, freespin_id=${freespin_id}, brand_uid=${brand_uid}, start_after=${start_after}, end_before=${end_before}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `무료 스핀 조회 실패: game_id=${game_id}, currency=${gameCurrency}, freespin_id=${freespin_id}, brand_uid=${brand_uid}, start_after=${start_after}, end_before=${end_before}`,
      );
      return {
        status: 0,
        error: 'QUERY_FREE_SPIN_REQUEST_FAILED',
        message: error.message,
      };
    }
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
    this.checkApiAvailability();

    try {
      const url = `${this.dcsConfig.getBetDataUrl}/dcs/getUsersBetSummary`;

      this.logger.log(
        `사용자 베팅 요약 조회 요청: page=${page}, date=${date}, provider=${provider}, brand_uid=${brand_uid}`,
      );

      const body = {
        brand_id: this.dcsConfig.brandId,
        sign: this.generateSign(page, date, provider, brand_uid),
        page,
        date,
        provider,
        brand_uid,
      };

      const response = await firstValueFrom(
        this.httpService.post<{
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
        }>(url, body, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }),
      );

      this.logger.log(
        `사용자 베팅 요약 조회 성공: page=${page}, date=${date}, provider=${provider}, brand_uid=${brand_uid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `사용자 베팅 요약 조회 실패: page=${page}, date=${date}, provider=${provider}, brand_uid=${brand_uid}`,
      );
      return {
        status: 0,
        error: 'GET_USERS_BET_SUMMARY_REQUEST_FAILED',
        message: error.message,
      };
    }
  }
}
