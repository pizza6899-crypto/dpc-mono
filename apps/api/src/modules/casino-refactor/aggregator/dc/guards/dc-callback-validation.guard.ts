import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  VALIDATE_DC_CALLBACK_KEY,
  ValidateDcCallbackMetadata,
} from '../decorators/validate-dc-callback.decorator';
import { DcCallbackValidatorService } from '../application/dc-callback-validator.service';
import { DcCallbackValidationException } from '../domain/validation.exception';

/**
 * DC 콜백 검증 Guard
 * 필수 필드 검증 및 서명 검증을 수행
 */
@Injectable()
export class DcCallbackValidationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly validator: DcCallbackValidatorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body;

    // 메타데이터에서 검증 설정 가져오기
    const validationMetadata =
      this.reflector.getAllAndOverride<ValidateDcCallbackMetadata>(
        VALIDATE_DC_CALLBACK_KEY,
        [context.getHandler(), context.getClass()],
      );

    // 검증 설정이 없으면 통과 (기존 동작 유지)
    if (!validationMetadata) {
      return true;
    }

    const { requiredFields, signParams } = validationMetadata;

    // 1. 필수 필드 검증
    const requiredFieldsResponse =
      this.validator.validateRequiredFields(body, requiredFields);
    if (requiredFieldsResponse) {
      throw new DcCallbackValidationException(requiredFieldsResponse);
    }

    // 2. 서명 검증
    const signParamsValues = signParams.map((param) => body[param]);
    const signVerificationResponse = this.validator.verifySign(
      body.brand_id,
      body.sign,
      ...signParamsValues,
    );

    if (signVerificationResponse) {
      throw new DcCallbackValidationException(signVerificationResponse);
    }

    return true;
  }
}

