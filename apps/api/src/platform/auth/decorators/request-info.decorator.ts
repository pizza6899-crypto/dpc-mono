import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestClientInfo } from '../../http/types/client-info.types';

/**
 * 요청자 정보를 가져오는 데코레이터
 *
 * @description RequestInfoInterceptor에서 추출한 클라이언트 정보를 가져옵니다.
 * 클라이언트 정보 추출은 인터셉터에서 한 번만 수행되므로 성능이 최적화됩니다.
 *
 * @example
 * ```typescript
 * @Post('login')
 * async login(@RequestClientInfoParam() reqInfo: RequestClientInfo) {
 *   console.log(reqInfo.ip); // 실제 클라이언트 IP
 *   console.log(reqInfo.country); // 국가 코드
 *   console.log(reqInfo.isMobile); // 모바일 여부
 * }
 * ```
 *
 * @example 특정 필드만 가져오기
 * ```typescript
 * @Post('login')
 * async login(@RequestClientInfoParam('ip') ip: string) {
 *   console.log(ip); // IP만 가져오기
 * }
 * ```
 */
export const RequestClientInfoParam = createParamDecorator(
  (
    data: keyof RequestClientInfo | undefined,
    ctx: ExecutionContext,
  ): RequestClientInfo | any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const clientInfo = request.clientInfo;

    // 인터셉터에서 추출되지 않은 경우 (예: 인터셉터가 적용되지 않은 경로)
    if (!clientInfo) {
      throw new Error(
        'RequestClientInfo가 추출되지 않았습니다. RequestInfoInterceptor가 적용되었는지 확인하세요.',
      );
    }

    // 특정 필드만 요청한 경우
    if (data) {
      return clientInfo[data];
    }

    return clientInfo;
  },
);
