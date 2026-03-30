// src/platform/throttle/throttle.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ThrottleService } from './throttle.service';
import { THROTTLE_KEY } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleOptions, ThrottleScope } from './types/throttle.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly throttleService: ThrottleService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 데코레이터에서 쓰로틀링 설정 가져오기
    const throttleOptions = this.reflector.getAllAndOverride<ThrottleOptions>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 쓰로틀링 설정이 없으면 통과
    if (!throttleOptions) {
      return true;
    }

    // 키 생성
    const key = throttleOptions.keyGenerator
      ? throttleOptions.keyGenerator(request)
      : this.throttleService.generateKey(
        request,
        throttleOptions.scope || ThrottleScope.IP,
      );

    // 쓰로틀링 체크
    const result = await this.throttleService.checkAndIncrement(
      key,
      throttleOptions,
    );

    // 제한 초과 시 예외 발생
    if (!result.allowed) {
      throw new ApiException(
        MessageCode.THROTTLE_TOO_MANY_REQUESTS,
        HttpStatus.TOO_MANY_REQUESTS,
        `Too many requests. Limit: ${result.limit}, Remaining: ${result.remaining}, Retry after: ${result.retryAfter}s`,
      );
    }

    // 응답 헤더에 쓰로틀링 정보 추가 (선택사항)
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', result.limit.toString());
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    response.setHeader('X-RateLimit-Reset', result.resetTime.toString());

    if (result.retryAfter) {
      response.setHeader('Retry-After', result.retryAfter.toString());
    }

    return true;
  }
}
