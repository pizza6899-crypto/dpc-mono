// src/modules/casino-refactor/aggregator/dc/infrastructure/dc-aggregator-api.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/common/env/env.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { firstValueFrom } from 'rxjs';
import { DcsConfig } from 'src/common/env/env.types';
import * as crypto from 'crypto';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { HttpStatusCode } from 'axios';
import { GameProvider } from '@repo/database';
import { DcMapperService } from './dc-mapper.service';
import type { DcAggregatorApiPort } from '../ports/out/dc-aggregator-api.port';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DC Aggregator API Adapter
 *
 * DC 애그리게이터 API와의 통신을 담당하는 어댑터입니다.
 * 필요한 메서드만 구현합니다.
 */
@Injectable()
export class DcAggregatorApiAdapter implements DcAggregatorApiPort {
  private readonly logger = new Logger(DcAggregatorApiAdapter.name);
  private readonly dcConfig: DcsConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly dcMapperService: DcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {
    this.dcConfig = this.envService.dcs;
  }

  /**
   * API 호출 전 체크 메서드
   */
  private checkApiAvailability(): void {
    if (!this.dcConfig.apiEnabled) {
      this.logger.error('DC API 송신이 비활성화되어 있습니다.');
      throw new Error('DC API is disabled');
    }
  }

  /**
   * Sign 생성 함수
   * Sign = MD5(brand_id + ...추가 파라미터들 + api_key)
   */
  private generateSign(...params: (string | number | undefined)[]): string {
    const baseString =
      this.dcConfig.brandId +
      params
        .filter((param) => param !== undefined && param !== null)
        .map((param) => String(param))
        .join('') +
      this.dcConfig.apiKey;

    return crypto
      .createHash('md5')
      .update(baseString)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * 게임 목록 조회
   * TODO: 테스트용으로 mock 데이터 반환 중. 실제 API 연동 시 주석 해제 필요
   */
  async getGameList({ provider }: { provider: GameProvider }) {
    const startTime = Date.now();
    const endpoint = '/dcs/getGameList';

    const body = {
      brand_id: this.dcConfig.brandId,
      sign: this.generateSign(),
      provider: this.dcMapperService.toDcProvider(provider),
    };

    try {
      // Mock 데이터 파일 읽기 (임시)
      // process.cwd()는 apps/api를 가리키므로, src부터의 경로를 사용
      const mockFilePath = path.join(
        process.cwd(),
        'src',
        'modules',
        'casino-refactor',
        'aggregator',
        'dc',
        'infrastructure',
        'gamelist_mock_dc.txt',
      );

      if (!fs.existsSync(mockFilePath)) {
        this.logger.error(`Mock 파일을 찾을 수 없습니다: ${mockFilePath}`);
        throw new Error(`Mock file not found: ${mockFilePath}`);
      }

      const mockFileContent = fs.readFileSync(mockFilePath, 'utf-8');
      const mockData = JSON.parse(mockFileContent);

      const duration = Date.now() - startTime;

      // API audit 로그 저장 (성공)
      this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'DCS',
          method: 'POST',
          endpoint,
          statusCode: 200,
          duration,
          success: true,
          requestBody: body,
          responseBody: mockData,
        },
      });

      return mockData;

      // 기존 API 호출 로직 (주석 처리)
      // this.checkApiAvailability();
      //
      // const url = `${this.dcConfig.apiUrl}/dcs/getGameList`;
      //
      // const response = await firstValueFrom(
      //   this.httpService.post<{
      //     code: number;
      //     msg: string;
      //     data: {
      //       provider: string;
      //       game_id: number;
      //       game_name: string;
      //       game_name_cn: string;
      //       release_date: string;
      //       rtp: string;
      //       game_icon: string;
      //       content_type: string;
      //       game_type: string;
      //       content: string;
      //     }[];
      //   }>(url, body, {
      //     headers: {
      //       'Content-Type': 'application/json',
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
      //     provider: 'DCS',
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
          provider: 'DCS',
          method: 'POST',
          endpoint,
          statusCode: 500,
          duration,
          success: false,
          requestBody: body,
          responseBody: null,
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

