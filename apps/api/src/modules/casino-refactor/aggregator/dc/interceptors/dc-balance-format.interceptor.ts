import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@repo/database';

/**
 * DC 콜백 Balance 포맷 Interceptor
 * 응답의 data.balance 값을 Decimal(16,6) 형식으로 검증 및 수정
 * - 전체 16자리, 소수점 이하 6자리
 * - 정수 부분 최대 10자리
 */
@Injectable()
export class DcBalanceFormatInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DcBalanceFormatInterceptor.name);

  // Decimal(16,6) 제약: 전체 16자리, 소수점 이하 6자리
  private readonly MAX_DECIMAL_PLACES = 6;
  private readonly MAX_INTEGER_DIGITS = 10; // 16 - 6 = 10
  private readonly MAX_VALUE = 9999999999.999999; // 10자리 정수 + 6자리 소수

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data !== 'object') {
          return data;
        }

        // data.balance가 있는 경우 검증 및 수정
        if (data.data && typeof data.data === 'object' && 'balance' in data.data) {
          const balance = data.data.balance;

          if (typeof balance === 'number') {
            const normalizedBalance = this.normalizeBalance(balance);
            
            // 값이 변경된 경우 로그 기록
            if (normalizedBalance !== balance) {
              this.logger.warn(
                `Balance 값이 Decimal(16,6) 범위를 초과하여 수정됨: ${balance} -> ${normalizedBalance}`,
              );
            }

            data.data.balance = normalizedBalance;
          }
        }

        return data;
      }),
    );
  }

  /**
   * balance 값을 Decimal(16,6) 형식으로 정규화
   * Decimal(16,6): 전체 16자리, 소수점 이하 6자리, 정수 부분 최대 10자리
   */
  private normalizeBalance(balance: number): number {
    // NaN이나 Infinity 체크
    if (!isFinite(balance)) {
      return 0;
    }

    // Decimal 객체로 변환하여 정밀도 처리
    const decimal = new Prisma.Decimal(balance);

    // 최소값 제한 (음수는 0으로)
    if (decimal.lt(0)) {
      return 0;
    }

    // 소수점 6자리로 제한
    const normalized = decimal.toDecimalPlaces(this.MAX_DECIMAL_PLACES);

    // 정수 부분이 10자리를 초과하는지 확인
    const integerPart = normalized.floor();
    // 정수 부분의 자릿수 계산 (이미 음수는 체크했으므로 양수만 고려)
    const integerDigits = integerPart.toString().length;
    
    if (integerDigits > this.MAX_INTEGER_DIGITS) {
      // 정수 부분이 10자리를 초과하면 최대값으로 제한
      return this.MAX_VALUE;
    }

    // 최대값 제한 (정수 10자리 + 소수 6자리)
    if (normalized.gt(this.MAX_VALUE)) {
      return this.MAX_VALUE;
    }

    return normalized.toNumber();
  }
}

