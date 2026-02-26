import { ExchangeCurrencyCode } from '@prisma/client';

/**
 * UserCurrency Value Object
 *
 * 사용자의 통화 설정 정보를 담당하는 Value Object입니다.
 * - primaryCurrency: 주력/메인 통화 (잔액 표시, 리워드 수령 등 기준)
 * - playCurrency: 실제 게임 플레이 시 사용되는 통화
 */
export class UserCurrency {
    private constructor(
        public readonly primaryCurrency: ExchangeCurrencyCode,
        public readonly playCurrency: ExchangeCurrencyCode,
    ) { }

    /**
     * UserCurrency 생성
     */
    static create(params?: {
        primaryCurrency?: ExchangeCurrencyCode;
        playCurrency?: ExchangeCurrencyCode;
    }): UserCurrency {
        return new UserCurrency(
            params?.primaryCurrency || ExchangeCurrencyCode.USD,
            params?.playCurrency || ExchangeCurrencyCode.USD,
        );
    }

    /**
     * Persistence 데이터로부터 생성
     */
    static fromPersistence(data: {
        primaryCurrency: ExchangeCurrencyCode;
        playCurrency: ExchangeCurrencyCode;
    }): UserCurrency {
        return new UserCurrency(data.primaryCurrency, data.playCurrency);
    }

    /**
     * Persistence 레이어로 변환
     */
    toPersistence(): {
        primaryCurrency: ExchangeCurrencyCode;
        playCurrency: ExchangeCurrencyCode;
    } {
        return {
            primaryCurrency: this.primaryCurrency,
            playCurrency: this.playCurrency,
        };
    }

    /**
     * 통화 정보 업데이트
     */
    update(
        updates: Partial<{
            primaryCurrency: ExchangeCurrencyCode;
            playCurrency: ExchangeCurrencyCode;
        }>,
    ): UserCurrency {
        return new UserCurrency(
            updates.primaryCurrency || this.primaryCurrency,
            updates.playCurrency || this.playCurrency,
        );
    }
}
