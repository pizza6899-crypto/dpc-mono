import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from 'src/common/env/env.service';
import { DcsConfig } from 'src/common/env/env.types';
import * as crypto from 'crypto';
import {
  DcsResponseCode,
  getDcsResponse,
} from 'src/modules/casino/dcs/constants/dcs-response-codes';
import { DcCommonResponseDto } from '../dtos/callback.dto';

@Injectable()
export class DcCallbackValidatorService {
  private readonly logger = new Logger(DcCallbackValidatorService.name);
  private readonly dcsConfig: DcsConfig;

  constructor(private readonly envService: EnvService) {
    this.dcsConfig = this.envService.dcs;
  }

  /**
   * Sign 검증 함수
   * Sign = MD5(brand_id + 파라미터들(순서대로) + api_key)
   * @param brand_id 브랜드 ID
   * @param sign 검증할 sign 값
   * @param additionalParams 추가 파라미터들 (가변적, 순서 중요)
   * @returns 검증 결과 (null: 유효, DcCommonResponseDto: 무효)
   */
  verifySign(
    brand_id: string,
    sign: string,
    ...additionalParams: (string | number | undefined)[]
  ): null | DcCommonResponseDto {
    // 1. env의 brandId와 입력받은 brand_id 비교
    if (this.dcsConfig.brandId !== brand_id) {
      return getDcsResponse(DcsResponseCode.BRAND_NOT_EXIST);
    }

    // 2. env의 brandId + 가변 파라미터들(순서대로) + env의 apiKey 문자열 합성
    const baseString =
      this.dcsConfig.brandId +
      additionalParams
        .filter((param) => param !== undefined && param !== null)
        .map((param) => String(param))
        .join('') +
      this.dcsConfig.apiKey;

    // 3. MD5 해시 생성
    const calculatedSign = crypto
      .createHash('md5')
      .update(baseString)
      .digest('hex');

    // 4. 생성한 해시와 입력받은 sign 비교
    const isValid = calculatedSign.toLowerCase() === sign.toLowerCase();

    if (!isValid) {
      return getDcsResponse(DcsResponseCode.SIGN_ERROR);
    }

    return null;
  }

  /**
   * 필수 파라미터 검증
   */
  validateRequiredFields(
    body: any,
    requiredFields: string[],
  ): DcCommonResponseDto | null {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = body[field];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      this.logger.warn(`필수 파라미터 누락: ${missingFields.join(', ')}`);
      return getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
    }

    return null;
  }
}

