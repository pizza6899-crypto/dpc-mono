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

// 🎯 로그 설정
interface LogConfig {
  maxRequestSize: number;
  maxResponseSize: number;
  truncateThreshold: number;
}

// 🎯 데이터 압축 결과 타입
interface CompressedData {
  data: any;
  size: number;
  wasTruncated: boolean;
}

@Injectable()
export class WhitecliffApiLoggingInterceptor {
  private readonly logConfig: LogConfig = {
    maxRequestSize: 10 * 1024, // 10KB
    maxResponseSize: 50 * 1024, // 50KB
    truncateThreshold: 5 * 1024, // 5KB
  };
  private static isInterceptorsSetup = false; // 추가
  private readonly whitecliffEndpoints: string[] = [];

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
  ) {
    // Whitecliff 설정에서 모든 엔드포인트 추출
    const whitecliffConfigs = this.envService.whitecliff;
    this.whitecliffEndpoints = whitecliffConfigs
      .map((config) => config.endpoint)
      .filter((endpoint) => endpoint && endpoint.length > 0);

    if (!WhitecliffApiLoggingInterceptor.isInterceptorsSetup) {
      this.setupInterceptors();
      WhitecliffApiLoggingInterceptor.isInterceptorsSetup = true;
    }
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.httpService.axiosRef.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        if (this.isWhitecliffRequest(config)) {
          config.metadata = {
            startTime: nowUtc().getTime(),
            action: this.extractAction(config),
            endpoint: config.url || '',
            method: config.method || '',
            requestData: this.compressData(
              config.data,
              this.logConfig.maxRequestSize,
            ).data,
            module: 'whitecliff', // 모듈 식별자 추가
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

        // Whitecliff 요청인지 확인 추가
        if (
          config.metadata &&
          config.metadata.module === 'whitecliff' &&
          this.isWhitecliffRequest(config)
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
            console.error('API 로그 저장 실패:', error.message);
          });
        }
        return response;
      },
      (error) => {
        const config = error.config as ExtendedAxiosRequestConfig;
        // Whitecliff 요청인지 확인 추가
        if (
          config?.metadata &&
          config.metadata.module === 'whitecliff' &&
          this.isWhitecliffRequest(config)
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

  // 🎯 통합된 데이터 압축 메서드
  private compressData(data: any, maxSize: number): CompressedData {
    if (!data) {
      return { data, size: 0, wasTruncated: false };
    }

    try {
      // 🎯 JSON 문자열화를 한 번만 수행
      const jsonStr = JSON.stringify(data);
      const dataSize = Buffer.byteLength(jsonStr, 'utf8');

      // 크기가 작으면 그대로 반환
      if (dataSize <= this.logConfig.truncateThreshold) {
        return { data, size: dataSize, wasTruncated: false };
      }

      // 크기가 크면 압축
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
      // 🎯 JSON.stringify 실패 시 안전 처리
      console.warn('데이터 직렬화 실패:', error.message);
      return {
        data: {
          _error: true,
          _message: 'JSON serialization failed',
          _originalError: error.message,
          _type: typeof data,
          _isArray: Array.isArray(data),
        },
        size: 0,
        wasTruncated: true,
      };
    }
  }

  // 🎯 응답 데이터 특별 처리
  private compressResponseData(data: any, action: string): CompressedData {
    if (!data) {
      return { data, size: 0, wasTruncated: false };
    }

    try {
      const jsonStr = JSON.stringify(data);
      const dataSize = Buffer.byteLength(jsonStr, 'utf8');

      // 작은 데이터는 그대로
      if (dataSize <= this.logConfig.truncateThreshold) {
        return { data, size: dataSize, wasTruncated: false };
      }

      // 액션별 특별 처리
      let compressedData: any;
      switch (action) {
        case 'GAME_LIST':
          compressedData = this.compressGameListData(data, dataSize);
          break;
        case 'PUSHED_BET_HISTORY':
          compressedData = this.compressBetHistoryData(data, dataSize);
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
          _message: 'Response data compression failed',
          _originalError: error.message,
        },
        size: 0,
        wasTruncated: true,
      };
    }
  }

  // 🎯 게임 리스트 압축 (안전성 개선)
  private compressGameListData(data: any, originalSize: number): any {
    if (!data || typeof data !== 'object') {
      return this.createErrorData('Invalid game list data', originalSize);
    }

    const gameList = data.game_list;
    if (!gameList || typeof gameList !== 'object') {
      return this.createErrorData('Invalid game_list structure', originalSize);
    }

    const summary: any = {};
    let totalGames = 0;
    let totalEnabled = 0;

    try {
      for (const [providerId, games] of Object.entries(gameList)) {
        if (Array.isArray(games)) {
          const enabledCount = games.filter(
            (g: any) => g?.is_enabled === 1,
          ).length;
          totalGames += games.length;
          totalEnabled += enabledCount;

          summary[providerId] = {
            count: games.length,
            enabledCount,
            // 🎯 안전한 샘플 추출
            sample: games.slice(0, 2).map((game) => ({
              game_id: game?.game_id,
              game_name: game?.game_name,
              prd_category: game?.prd_category,
              is_enabled: game?.is_enabled,
            })),
            categories: this.getUniqueCategories(games),
          };
        }
      }

      return {
        status: data.status,
        _compressed: 'GAME_LIST',
        _originalSize: originalSize,
        _formattedSize: this.formatBytes(originalSize),
        _summary: {
          totalProviders: Object.keys(gameList).length,
          totalGames,
          totalEnabled,
          compressionRatio: `${(originalSize / 1024 / Object.keys(summary).length).toFixed(1)}KB per provider`,
        },
        providers: summary,
      };
    } catch (error) {
      return this.createErrorData(
        `Game list compression failed: ${error.message}`,
        originalSize,
      );
    }
  }

  // 🎯 베팅 히스토리 압축
  private compressBetHistoryData(data: any, originalSize: number): any {
    if (!data?.bets || !Array.isArray(data.bets)) {
      return this.createErrorData('Invalid bet history data', originalSize);
    }

    try {
      const bets = data.bets;
      const totalStake = bets.reduce(
        (sum: number, bet: any) => sum + (Number(bet?.stake) || 0),
        0,
      );
      const totalPayout = bets.reduce(
        (sum: number, bet: any) => sum + (Number(bet?.payout) || 0),
        0,
      );

      return {
        status: data.status,
        _compressed: 'BET_HISTORY',
        _originalSize: originalSize,
        _formattedSize: this.formatBytes(originalSize),
        _summary: {
          totalBets: bets.length,
          totalStake,
          totalPayout,
          netResult: totalPayout - totalStake,
          dateRange: {
            start: bets[0]?.bet_time,
            end: bets[bets.length - 1]?.bet_time,
          },
        },
        sample_bets: bets.slice(0, 5).map((bet) => ({
          txn_id: bet?.txn_id,
          stake: bet?.stake,
          payout: bet?.payout,
          bet_time: bet?.bet_time,
          game_id: bet?.game_id,
        })),
      };
    } catch (error) {
      return this.createErrorData(
        `Bet history compression failed: ${error.message}`,
        originalSize,
      );
    }
  }

  // 🎯 일반 데이터 압축
  private compressGenericData(data: any, originalSize: number): any {
    if (originalSize > this.logConfig.maxResponseSize) {
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
    return data;
  }

  // 🎯 에러 데이터 생성 헬퍼
  private createErrorData(message: string, originalSize: number): any {
    return {
      _error: true,
      _message: message,
      _originalSize: originalSize,
      _formattedSize: this.formatBytes(originalSize),
      _timestamp: nowUtc().toISOString(),
    };
  }

  // 🎯 카테고리 안전 추출
  private getUniqueCategories(games: any[]): string[] {
    try {
      const categories = games
        .map((g) => g?.prd_category)
        .filter((cat) => cat && typeof cat === 'string');
      return [...new Set(categories)];
    } catch {
      return [];
    }
  }

  // 🎯 데이터 요약 생성 (개선)
  private createDataSummary(data: any): any {
    if (!data || typeof data !== 'object') {
      return { type: typeof data, value: String(data).substring(0, 100) };
    }

    const summary: any = {};

    try {
      // 안전한 필드 추출
      if (data.user) {
        summary.user = {
          id: data.user.id,
          hasName: !!data.user.name,
          language: data.user.language,
        };
      }

      if (data.prd) {
        summary.prd = { ...data.prd };
      }

      // 쿼리 파라미터들
      const queryFields = [
        'lang',
        'prd_id',
        'txn_id',
        'round_id',
        'start_date',
        'end_date',
      ];
      for (const field of queryFields) {
        if (data[field] !== undefined) {
          summary[field] = data[field];
        }
      }

      // 객체 구조 정보
      summary._structure = {
        keys: Object.keys(data).slice(0, 10), // 처음 10개 키만
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

  // 🎯 바이트 크기 포맷팅
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private isWhitecliffRequest(config: any): boolean {
    const url = config.url || '';
    const baseURL = config.baseURL || '';
    const fullUrl = (baseURL + url).toLowerCase();

    return this.whitecliffEndpoints.some((endpoint) => {
      return fullUrl.includes(endpoint.toLowerCase());
    });
  }

  private extractAction(config: any): string {
    const url = config.url || '';
    if (url.includes('/auth')) return 'LAUNCH_GAME';
    if (url.includes('/result/')) return 'BET_RESULTS';
    if (url.includes('/transaction')) return 'TRANSACTION_RESULTS';
    if (url.includes('/gamelist')) return 'GAME_LIST'; // 🎯 수정
    if (url.includes('/getpushbets')) return 'PUSHED_BET_HISTORY';
    if (url.includes('/bet/results')) return 'BET_RESULTS_URL';
    return 'UNKNOWN';
  }

  private async saveApiLog(logData: any): Promise<void> {
    try {
      await this.prisma.whitecliffApiLog.create({
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
      console.error('Whitecliff API 로그 저장 실패:', error.message);
      // 🎯 중요: 로그 저장 실패가 원본 요청에 영향을 주면 안됨
    }
  }

  private extractUserId(data: any): bigint | undefined {
    return (
      data?.summary?.user?.id?.toString() ||
      data?.user?.id?.toString() ||
      data?.user_id?.toString()
    );
  }
}
