import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { extractClientInfo } from '../utils/request-info.util';

/**
 * Request Client Info 인터셉터
 *
 * 요청마다 클라이언트 정보를 한 번만 추출하여 request 객체에 저장합니다.
 * 데코레이터는 저장된 값을 단순히 가져오기만 합니다.
 * 또한 pino-http에서 생성한 req.id를 응답 헤더에 추가합니다.
 */
@Injectable()
export class RequestInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 이미 추출된 정보가 있으면 재사용 (중복 추출 방지)
    if (!request.clientInfo) {
      request.clientInfo = extractClientInfo(request);
    }

    // pino-http에서 생성한 req.id를 응답 헤더에 추가
    // genReqId로 생성된 ID가 req.id에 자동 할당됨
    if (request.id) {
      response.setHeader('x-request-id', String(request.id));
    }

    return next.handle();
  }
}

