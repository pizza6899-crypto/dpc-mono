import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnvService } from '../../../common/env/env.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { nowUtc } from 'src/utils/date.util';
import { firstValueFrom } from 'rxjs';

interface JwtTokenData {
  token: string;
  expiresAt: number; // Unix timestamp
}

@Injectable()
export class NowPaymentApiService {
  private readonly logger = new Logger(NowPaymentApiService.name);
  private readonly TOKEN_REDIS_KEY = 'nowpayment:jwt_token';

  constructor(
    private envService: EnvService,
    private redisService: RedisService,
    private advisoryLockService: AdvisoryLockService,
    private readonly httpService: HttpService,
  ) {}

  private async getJwtToken(): Promise<string> {
    // Redis에서 토큰 조회
    const tokenData = await this.redisService.get<JwtTokenData>(
      this.TOKEN_REDIS_KEY,
    );

    // 토큰이 유효한지 확인 (5분 = 300초, 여유를 두고 4분 30초로 설정)
    if (tokenData && nowUtc().getTime() < tokenData.expiresAt - 30000) {
      // 30초 여유
      return tokenData.token;
    }

    // 토큰이 없거나 만료된 경우, 락을 사용해서 중복 요청 방지
    await this.advisoryLockService.acquireLock(
      LockNamespace.PAYMENT_TOKEN,
      'nowpayment',
      {
        throwThrottleError: true,
      },
    );

    // 락 획득 후 다시 한번 토큰 확인 (Double-checked locking)
    const existingTokenData = await this.redisService.get<JwtTokenData>(
      this.TOKEN_REDIS_KEY,
    );
    if (
      existingTokenData &&
      nowUtc().getTime() < existingTokenData.expiresAt - 30000
    ) {
      return existingTokenData.token;
    }

    // 새 토큰 발급
    const newToken = await this.issueNewToken();

    // Redis에 토큰 저장 (4분 30초 TTL)
    const newTokenData: JwtTokenData = {
      token: newToken,
      expiresAt: nowUtc().getTime() + 4.5 * 60 * 1000, // 4분 30초 후
    };

    await this.redisService.set(this.TOKEN_REDIS_KEY, newTokenData, 270); // 4분 30초

    this.logger.log('NowPayment JWT 토큰이 새로 발급되었습니다.');
    return newToken;
  }

  public async issueNewToken(): Promise<string> {
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/v1/auth`,
          {
            email: config.email,
            password: config.password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      if (!response.data.token) {
        throw new Error('NowPayment 응답에 토큰이 없습니다.');
      }

      return response.data.token;
    } catch (error) {
      this.logger.error(error, 'NowPayment JWT 토큰 발급 실패');
      throw error;
    }
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getJwtToken();
    const config = this.envService.nowPayment;

    return {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      Authorization: `Bearer ${token}`,
    };
  }

  async invalidateToken(): Promise<void> {
    await this.redisService.del(this.TOKEN_REDIS_KEY);
    this.logger.log('NowPayment JWT 토큰이 무효화되었습니다.');
  }

  // 토큰 상태 확인 (디버깅용)
  async getTokenStatus(): Promise<{
    exists: boolean;
    expiresAt?: number;
    timeLeft?: number;
  }> {
    const tokenData = await this.redisService.get<JwtTokenData>(
      this.TOKEN_REDIS_KEY,
    );

    if (!tokenData) {
      return { exists: false };
    }

    const timeLeft = tokenData.expiresAt - nowUtc().getTime();
    return {
      exists: true,
      expiresAt: tokenData.expiresAt,
      timeLeft: Math.max(0, timeLeft),
    };
  }

  async createPayment(
    priceAmount: number,
    priceCurrency: string,
    payCurrency: string,
    orderId: string,
  ): Promise<{
    payment_id: string;
    payment_status: string;
    pay_address: string;
    price_amount: number;
    price_currency: string;
    pay_amount: number;
    amount_received: number;
    pay_currency: string;
    order_id: string;
    order_description: string | null;
    payin_extra_id: string | null;
    ipn_callback_url: string;
    customer_email: string | null;
    created_at: string;
    updated_at: string;
    purchase_id: string;
    smart_contract: string | null;
    network: string;
    network_precision: number | null;
    time_limit: number | null;
    burning_percent: number | null;
    expiration_estimate_date: string;
    is_fixed_rate: boolean;
    is_fee_paid_by_user: boolean;
    valid_until: string;
    type: string;
    product: string;
    origin_ip: string;
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/v1/payment`,
          {
            price_amount: priceAmount,
            price_currency: priceCurrency,
            pay_currency: payCurrency,
            order_id: orderId,
            ipn_callback_url: config.ipnCallbackUrl,
            is_fixed_rate: this.envService.nowPayment.isFixedRate,
            is_fee_paid_by_user: this.envService.nowPayment.isFeePaidByUser,
          },
          {
            headers,
            timeout: 30000,
          },
        ),
      );

      this.logger.log(
        `페이먼트 생성 완료, Payment ID: ${response.data.payment_id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(error, 'NowPayment 페이먼트 생성 실패');
      throw error;
    }
  }

  // 인보이스 상태 조회
  async getInvoiceStatus(paymentId: string): Promise<any> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/v1/payment/${paymentId}`, {
          headers,
          timeout: 30000,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(error, 'NowPayment 인보이스 상태 조회 실패');
      throw error;
    }
  }

  // 환율 추정 조회
  async getEstimate(
    amount: number,
    currencyFrom: string,
    currencyTo: string,
  ): Promise<{
    currency_from: string;
    amount_from: number;
    currency_to: string;
    estimated_amount: string;
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/v1/estimate`, {
          headers,
          params: {
            amount,
            currency_from: currencyFrom,
            currency_to: currencyTo,
          },
          timeout: 30000,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        error,
        `NowPayment 환율 추정 조회 실패: ${amount} ${currencyFrom} → ${currencyTo}`,
      );
      throw error;
    }
  }

  // 여러 통화에 대한 환율 추정 조회 (배치)
  async getMultipleEstimates(
    amount: number,
    currencyFrom: string,
    currenciesTo: string[],
  ): Promise<
    Array<{
      currency_from: string;
      amount_from: number;
      currency_to: string;
      estimated_amount: string;
    }>
  > {
    const estimates = await Promise.allSettled(
      currenciesTo.map((currencyTo) =>
        this.getEstimate(amount, currencyFrom, currencyTo),
      ),
    );

    const results = estimates
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.warn(
            `환율 추정 실패: ${amount} ${currencyFrom} → ${currenciesTo[index]}`,
            result.reason,
          );
          return null;
        }
      })
      .filter((result) => result !== null);

    return results;
  }

  // 페이아웃 생성
  async createPayout(params: {
    address: string;
    addressExtraId?: string;
    fiat_amount: number;
    fiat_currency: string;
    crypto_currency: string;
  }): Promise<{
    id: string;
    withdrawals: {
      is_request_payouts: boolean;
      id: string; // 출금 ID
      address: string;
      currency: string;
      ipn_callback_url: string;
      amount: string;
      batch_withdrawal_id: string; // 배치 ID
      status: string;
      error: string | null;
      extra_id: string | null;
      hash: string | null;
      payout_description: string | null;
      unique_external_id: string | null;
      created_at: string; // ISO 날짜 문자열
      requested_at: string | null;
      updated_at: string | null;
      update_history_log: string | null;
      rejected_check_attempts: number;
      fee: string | null;
      fee_paid_by: string | null;
    }[];
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/v1/payout`,
          {
            ipn_callback_url: config.ipnCallbackUrl,
            withdrawals: [
              {
                address: params.address,
                extra_id:
                  !params.addressExtraId || params.addressExtraId.trim() === ''
                    ? null
                    : params.addressExtraId,
                currency: params.crypto_currency,
                fiat_amount: params.fiat_amount,
                fiat_currency: params.fiat_currency,
                ipn_callback_url: config.ipnCallbackUrl,
              },
            ],
          },
          {
            headers,
            timeout: 30000,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, 'NowPayment 페이아웃 생성 실패');
      throw error;
    }
  }

  // 페이아웃 인증
  async verifyPayout(payoutId: string): Promise<{
    payout_id: string;
    payout_status: string;
    amount: number;
    currency: string;
    address: string;
    order_id: string | null;
    order_description: string | null;
    created_at: string;
    updated_at: string;
    is_fee_paid_by_user: boolean;
    customer_email: string | null;
    transaction_id: string | null;
    network: string | null;
    txid: string | null;
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/v1/payout/${payoutId}`, {
          headers,
          timeout: 30000,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(error, 'NowPayment 페이아웃 인증 실패');
      throw error;
    }
  }

  // 암호화폐 주소 유효성 검사
  async validateAddress(
    address: string,
    currency: string,
    extra_id?: string,
  ): Promise<{
    isValid: boolean;
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/v1/payout/validate-address`, {
          headers,
          params: {
            address,
            currency,
            extra_id,
          },
          timeout: 30000,
        }),
      );

      return response.data;
    } catch (error) {
      return {
        isValid: false,
      };
    }
  }

  // 지원 가능한 통화 목록 조회
  async getAvailableCurrencies(): Promise<{
    currencies: {
      id: number;
      code: string;
      name: string;
      enable: boolean;
      wallet_regex: string;
      priority: number;
      extra_id_exists: boolean;
      extra_id_regex: string | null;
      logo_url: string;
      track: boolean;
      cg_id: string;
      is_maxlimit: boolean;
      network: string | null;
      smart_contract: string;
      network_precision: string;
      explorer_link_hash: string | null;
      precision: number;
      ticker: string;
      is_defi: boolean;
      is_popular: boolean;
      is_stable: boolean;
      available_for_to_conversion: boolean;
      trust_wallet_id: string | null;
      created_at: string;
      updated_at: string;
      available_for_payment: boolean;
      available_for_payout: boolean;
      extra_id_optional: boolean;
    }[];
  }> {
    const headers = await this.getHeaders();
    const config = this.envService.nowPayment;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/v1/full-currencies`, {
          headers,
          timeout: 30000,
        }),
      );

      this.logger.log(
        `지원 가능한 통화 목록 조회 완료: ${response.data.currencies.length}개 통화`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(error, 'NowPayment 지원 통화 목록 조회 실패');
      throw error;
    }
  }
}
