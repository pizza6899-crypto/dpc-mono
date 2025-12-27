import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponseDto } from '../types/pagination.types';
import { nowUtcIso } from 'src/utils/date.util';

interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PaginationInterceptor<T> implements NestInterceptor<
  PaginatedData<T>,
  PaginatedResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((result: PaginatedData<T>) => {
        const totalPages = Math.ceil(result.total / result.limit);

        return {
          success: true,
          data: result.data,
          timestamp: nowUtcIso(),
          statusCode: response.statusCode,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages,
            hasNext: result.page < totalPages,
            hasPrev: result.page > 1,
          },
        };
      }),
    );
  }
}
