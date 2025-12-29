import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { EnvService } from 'src/platform/env/env.service';
import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { nowUtc } from 'src/utils/date.util';

// 타입 확장
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
    action: string;
    endpoint: string;
    method: string;
    requestData: any;
    module?: string; // 모듈 식별자 추가
  };
}

// 로그 설정
interface LogConfig {
  maxRequestSize: number;
  maxResponseSize: number;
  truncateThreshold: number;
}

// 데이터 압축 결과 타입
interface CompressedData {
  data: any;
  size: number;
  wasTruncated: boolean;
}

@Injectable()
export class DcsApiLoggingInterceptor {
  private readonly logConfig: LogConfig = {
    maxRequestSize: 10 * 1024, // 10KB
    maxResponseSize: 50 * 1024, // 50KB
    truncateThreshold: 5 * 1024, // 5KB
  };
  private static isInterceptorsSetup = false;
  private readonly dcsEndpoints: string[] = [];

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
  ) {
    // DCS 설정에서 모든 엔드포인트 추출
    const dcsConfig = this.envService.dcs;
    this.dcsEndpoints = [dcsConfig.apiUrl, dcsConfig.getBetDataUrl].filter(
      (url) => url && url.length > 0,
    );

    if (!DcsApiLoggingInterceptor.isInterceptorsSetup) {
      this.setupInterceptors();
      DcsApiLoggingInterceptor.isInterceptorsSetup = true;
    }
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.httpService.axiosRef.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        if (this.isDcsRequest(config)) {
          config.metadata = {
            startTime: nowUtc().getTime(),
            action: this.extractAction(config),
            endpoint: config.url || '',
            method: config.method || '',
            requestData: this.compressData(
              config.data,
              this.logConfig.maxRequestSize,
            ).data,
            module: 'dcs', // 모듈 식별자 추가
          };
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 응답 인터셉터
    this.httpService.axiosRef.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as ExtendedAxiosRequestConfig;

        if (config.headers?.['x-skip-logging'] === 'true') {
          return response;
        }

        // DCS 요청인지 확인 추가
        if (
          config.metadata &&
          config.metadata.module === 'dcs' &&
          this.isDcsRequest(config)
        ) {
          const compressedResponse = this.compressResponseData(
            response.data,
            config.metadata.action,
          );
          this.saveApiLog({
            ...config.metadata,
            response: compressedResponse.data,
            statusCode: response.status,
            success: true,
            responseTime: nowUtc().getTime() - config.metadata.startTime,
          }).catch((error) => {
            console.error('DCS API 로그 저장 실패:', error.message);
          });
        }
        return response;
      },
      (error) => {
        const config = error.config as ExtendedAxiosRequestConfig;
        // DCS 요청인지 확인 추가
        if (
          config?.metadata &&
          config.metadata.module === 'dcs' &&
          this.isDcsRequest(config)
        ) {
          this.saveApiLog({
            ...config.metadata,
            response: {
              error: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
            },
            statusCode: error.response?.status || 500,
            success: false,
            responseTime: nowUtc().getTime() - config.metadata.startTime,
          }).catch((logError) => {
            console.error('에러 로그 저장 실패:', logError.message);
          });
        }
        return Promise.reject(error);
      },
    );
  }

  // 데이터 압축 메서드
  private compressData(data: any, maxSize: number): CompressedData {
    if (!data) {
      return { data, size: 0, wasTruncated: false };
    }

    try {
      const jsonStr = JSON.stringify(data);
      const dataSize = Buffer.byteLength(jsonStr, 'utf8');

      if (dataSize <= this.logConfig.truncateThreshold) {
        return { data, size: dataSize, wasTruncated: false };
      }

      if (dataSize > maxSize) {
        return {
          data: {
            _truncated: true,
            _originalSize: dataSize,
            _formattedSize: this.formatBytes(dataSize),
            _message: `데이터가 ${this.formatBytes(dataSize)}로 제한을 초과하여 압축됨`,
            _timestamp: nowUtc().toISOString(),
            summary: this.createDataSummary(data),
          },
          size: dataSize,
          wasTruncated: true,
        };
      }

      return { data, size: dataSize, wasTruncated: false };
    } catch (error) {
      console.warn('데이터 직렬화 실패:', error.message);
      return {
        data: {
          _error: true,
          _message: 'JSON 직렬화 실패',
          _originalError: error.message,
          _type: typeof data,
          _isArray: Array.isArray(data),
        },
        size: 0,
        wasTruncated: true,
      };
    }
  }

  // 응답 데이터 특별 처리
  private compressResponseData(data: any, action: string): CompressedData {
    if (!data) {
      return { data, size: 0, wasTruncated: false };
    }

    try {
      const jsonStr = JSON.stringify(data);
      const dataSize = Buffer.byteLength(jsonStr, 'utf8');

      if (dataSize <= this.logConfig.truncateThreshold) {
        return { data, size: dataSize, wasTruncated: false };
      }

      let compressedData: any;
      switch (action) {
        case 'GET_GAME_LIST':
          compressedData = this.compressGameListData(data, dataSize);
          break;
        case 'GET_BET_DATA':
          compressedData = this.compressBetData(data, dataSize);
          break;
        default:
          compressedData = this.compressGenericData(data, dataSize);
      }

      return {
        data: compressedData,
        size: dataSize,
        wasTruncated: true,
      };
    } catch (error) {
      console.warn('응답 데이터 압축 실패:', error.message);
      return {
        data: {
          _error: true,
          _message: '응답 데이터 압축 실패',
          _originalError: error.message,
        },
        size: 0,
        wasTruncated: true,
      };
    }
  }

  // 게임 리스트 압축
  private compressGameListData(data: any, originalSize: number): any {
    if (!data?.data || !Array.isArray(data.data)) {
      return this.createErrorData('Invalid game list data', originalSize);
    }

    try {
      const games = data.data;
      return {
        code: data.code,
        msg: data.msg,
        _compressed: 'GAME_LIST',
        _originalSize: originalSize,
        _formattedSize: this.formatBytes(originalSize),
        _summary: {
          totalGames: games.length,
          providers: [...new Set(games.map((g: any) => g.provider))],
        },
        sample_games: games.slice(0, 5).map((game: any) => ({
          game_id: game.game_id,
          game_name: game.game_name,
          provider: game.provider,
        })),
      };
    } catch (error) {
      return this.createErrorData(
        `Game list compression failed: ${error.message}`,
        originalSize,
      );
    }
  }

  // 베팅 데이터 압축
  private compressBetData(data: any, originalSize: number): any {
    if (!data?.data || !Array.isArray(data.data)) {
      return this.createErrorData('Invalid bet data', originalSize);
    }

    try {
      const bets = data.data;
      const totalAmount = bets.reduce(
        (sum: number, bet: any) => sum + (Number(bet?.amount) || 0),
        0,
      );

      return {
        code: data.code,
        msg: data.msg,
        _compressed: 'BET_DATA',
        _originalSize: originalSize,
        _formattedSize: this.formatBytes(originalSize),
        _summary: {
          totalBets: bets.length,
          totalAmount,
          page: data.page,
        },
        sample_bets: bets.slice(0, 5).map((bet: any) => ({
          wager_id: bet.wager_id,
          amount: bet.amount,
          game_id: bet.game_id,
          round_id: bet.round_id,
        })),
      };
    } catch (error) {
      return this.createErrorData(
        `Bet data compression failed: ${error.message}`,
        originalSize,
      );
    }
  }

  // 일반 데이터 압축
  private compressGenericData(data: any, originalSize: number): any {
    try {
      const truncatedStr = JSON.stringify(data).substring(
        0,
        this.logConfig.maxResponseSize,
      );
      return {
        _compressed: 'GENERIC',
        _originalSize: originalSize,
        _formattedSize: this.formatBytes(originalSize),
        _truncatedData: truncatedStr + '...[TRUNCATED]',
      };
    } catch {
      return this.createErrorData(
        'Generic data compression failed',
        originalSize,
      );
    }
  }

  // 에러 데이터 생성 헬퍼
  private createErrorData(message: string, originalSize: number): any {
    return {
      _error: true,
      _message: message,
      _originalSize: originalSize,
      _formattedSize: this.formatBytes(originalSize),
      _timestamp: nowUtc().toISOString(),
    };
  }

  // 데이터 요약 생성
  private createDataSummary(data: any): any {
    if (!data || typeof data !== 'object') {
      return { type: typeof data, value: String(data).substring(0, 100) };
    }

    const summary: any = {};

    try {
      // DCS 특화 필드 추출
      if (data.brand_id) summary.brand_id = data.brand_id;
      if (data.brand_uid) summary.brand_uid = data.brand_uid;
      if (data.game_id) summary.game_id = data.game_id;
      if (data.wager_id) summary.wager_id = data.wager_id;
      if (data.round_id) summary.round_id = data.round_id;
      if (data.currency) summary.currency = data.currency;

      summary._structure = {
        keys: Object.keys(data).slice(0, 10),
        hasNestedObjects: Object.values(data).some(
          (v) => typeof v === 'object' && v !== null,
        ),
        arrayCount: Object.values(data).filter((v) => Array.isArray(v)).length,
      };
    } catch (error) {
      summary._summaryError = error.message;
    }

    return summary;
  }

  // 바이트 크기 포맷팅
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // DCS 요청인지 확인
  private isDcsRequest(config: any): boolean {
    const baseURL = config.baseURL || '';
    const url = config.url || '';
    const fullUrl = (baseURL + url).toLowerCase();

    return this.dcsEndpoints.some((endpoint) => {
      return fullUrl.includes(endpoint.toLowerCase());
    });
  }

  // 액션 추출
  private extractAction(config: any): string {
    const url = config.url || '';
    if (url.includes('/loginGame')) return 'LOGIN_GAME';
    if (url.includes('/tryGame')) return 'TRY_GAME';
    if (url.includes('/getBetData')) return 'GET_BET_DATA';
    if (url.includes('/getReplay')) return 'GET_REPLAY';
    if (url.includes('/getGameList')) return 'GET_GAME_LIST';
    if (url.includes('/createFreeSpin')) return 'CREATE_FREE_SPIN';
    if (url.includes('/addFreeSpin')) return 'ADD_FREE_SPIN';
    if (url.includes('/queryFreeSpin')) return 'QUERY_FREE_SPIN';
    if (url.includes('/getUsersBetSummary')) return 'GET_USERS_BET_SUMMARY';
    return 'UNKNOWN';
  }

  // 로그 저장
  private async saveApiLog(logData: any): Promise<void> {
    try {
      await this.prisma.dcsApiLog.create({
        data: {
          action: logData.action,
          endpoint: logData.endpoint,
          httpMethod: logData.method?.toUpperCase(),
          request: {
            url: logData.endpoint,
            method: logData.method,
            data: logData.requestData,
            responseTime: logData.responseTime,
          },
          response: logData.response,
          statusCode: logData.statusCode,
          success: logData.success,
          userId: this.extractUserId(logData.requestData),
        },
      });
    } catch (error) {
      console.error('DCS API 로그 저장 실패:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
    }
  }

  private extractUserId(data: any): bigint | undefined {
    return data?.user_id?.toString() || data?.brand_uid?.toString();
  }
}
