import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PAGINATED } from '../decorators/paginated.decorator';
import { ApiResponseDto } from '../types/response.types';
import { PaginatedResponseDto } from '../types/pagination.types';

// SKIP_TRANSFORM 메타데이터 키 추가
export const SKIP_TRANSFORM = 'skipTransform';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T> | PaginatedResponseDto<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T> | PaginatedResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    // SKIP_TRANSFORM 플래그 확인
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM,
      [context.getHandler(), context.getClass()],
    );

    // 변환을 건너뛰어야 하는 경우 원본 응답 그대로 반환
    if (skipTransform) {
      return next.handle();
    }

    // 페이지네이션 플래그 확인
    const isPaginated = this.reflector.getAllAndOverride<boolean>(PAGINATED, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        const baseResponse = {
          success: true,
          timestamp: DateTime.utc().toISO(),
          statusCode: response.statusCode,
        };

        if (isPaginated && this.isPaginatedData(data)) {
          const totalPages = Math.ceil(data.total / data.limit);

          return {
            ...baseResponse,
            data: data.data,
            pagination: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages,
              hasNext: data.page < totalPages,
              hasPrev: data.page > 1,
            },
          } as PaginatedResponseDto<T>;
        }

        return {
          ...baseResponse,
          data,
        } as ApiResponseDto<T>;
      }),
    );
  }

  private isPaginatedData(data: any): data is {
    data: any[];
    total: number;
    page: number;
    limit: number;
  } {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.data) &&
      typeof data.total === 'number' &&
      typeof data.page === 'number' &&
      typeof data.limit === 'number'
    );
  }
}
