import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestClientInfo } from '../../http/types/client-info.types';
import { extractClientInfo } from '../../http/utils/request-info.util';

/**
 * 요청자 정보를 추출하는 데코레이터
 * @description Cloudflare 헤더를 포함하여 실제 클라이언트 정보를 추출합니다.
 * @example
 * ```typescript
 * @Post('login')
 * async login(@RequestInfo() reqInfo: RequestInfo) {
 *   console.log(reqInfo.ip); // 실제 클라이언트 IP
 *   console.log(reqInfo.country); // 국가 코드
 *   console.log(reqInfo.isMobile); // 모바일 여부
 * }
 * ```
 */
export const RequestClienttInfo = createParamDecorator(
  (
    data: keyof RequestClientInfo | undefined,
    ctx: ExecutionContext,
  ): RequestClientInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const requestInfo = extractClientInfo(request);

    // 특정 필드만 요청한 경우
    if (data) {
      return requestInfo[data] as any;
    }

    return requestInfo;
  },
);
