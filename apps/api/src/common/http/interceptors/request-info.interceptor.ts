import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { extractClientInfo } from '../utils/request-info.util';
import { ClsService } from 'nestjs-cls';
import { RequestContextStore } from 'src/infrastructure/cls/request-context.types';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';

/**
 * Request Client Info 인터셉터
 *
 * 요청마다 클라이언트 정보를 한 번만 추출하여 request 객체와 CLS 컨텍스트에 저장합니다.
 * 이를 통해 어느 서비스 레이어에서나 RequestContextService를 통해 정보를 가져올 수 있습니다.
 */
@Injectable()
export class RequestInfoInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService<RequestContextStore>) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 1. 클라이언트 정보 추출 및 Request 객체 저장
    if (!request.clientInfo) {
      request.clientInfo = extractClientInfo(request);
    }

    // 2. [핵심] CLS 컨텍스트 및 유저 정보 동기화
    this.cls.set('clientInfo', request.clientInfo);

    const user = (request as any).user as AuthenticatedUser | undefined;
    if (user) {
      this.cls.set('user', user);
    }

    // 3. pino-http에서 생성한 req.id를 응답 헤더에 추가
    if (request.id) {
      response.setHeader('x-request-id', String(request.id));
    }

    return next.handle();
  }
}
