// src/modules/deposit/application/get-crypto-deposit-address.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, PaymentProvider, DepositMethodType } from '@repo/database';
import { CRYPTO_CONFIG_REPOSITORY, DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort, DepositDetailRepositoryPort } from '../ports/out';
import { DepositDetail, DepositMethod, DepositAmount } from '../domain';
import { NowPaymentApiService } from '../../payment/infrastructure/now-payment-api.service';
import { CryptoDepositAddressResponseDto } from '../dtos/deposit-address-user.dto';
import { generateUid } from 'src/utils/id.util';

export interface GetCryptoDepositAddressParams {
    symbol: string;
    network: string;
    userId: bigint;
    amount?: Prisma.Decimal;
    ipAddress?: string;
    deviceFingerprint?: string;
}

@Injectable()
export class GetCryptoDepositAddressService {
    constructor(
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly cryptoConfigRepository: CryptoConfigRepositoryPort,
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        private readonly nowPaymentApiService: NowPaymentApiService,
    ) { }

    @Transactional()
    async execute({ symbol, network, userId, amount, ipAddress, deviceFingerprint }: GetCryptoDepositAddressParams): Promise<CryptoDepositAddressResponseDto> {
        // 1. 설정 조회
        const config = await this.cryptoConfigRepository.getBySymbolAndNetwork(symbol, network);

        // 2. 임시 입금 데이터 생성 (uid 획득을 위해)
        // Note: Amount가 0일 수도 있으나, NowPayment 호출 시에는 최소 금액 이상이어야 함
        const deposit = DepositDetail.create({
            uid: generateUid(),
            userId,
            depositCurrency: symbol as ExchangeCurrencyCode,
            depositNetwork: network,
            method: DepositMethod.create(DepositMethodType.CRYPTO_WALLET, PaymentProvider.NOWPAYMENT),
            amount: DepositAmount.create({
                requestedAmount: amount ?? new Prisma.Decimal(0),
            }),
            cryptoConfigId: config.id,
            ipAddress,
            deviceFingerprint,
        });

        const savedDeposit = await this.depositRepository.create(deposit);

        let payAddress = '';
        let payAddressExtraId: string | null = null;

        // 3. 만약 금액이 있는 경우 NowPayment API로 실제 주소 생성 시도
        if (amount && amount.gt(0)) {
            try {
                // NowPayment는 보통 USD 기반의 price_amount를 요구하거나, pay_currency를 직접 지정 가능
                // 여기서는 유저가 요청한 currency(symbol)를 pay_currency로 사용
                const payment = await this.nowPaymentApiService.createPayment(
                    amount.toNumber(),
                    'USD', // 기본 가격 단위 (설정에 따라 변경 가능)
                    symbol.toLowerCase(),
                    savedDeposit.uid!,
                );

                payAddress = payment.pay_address;
                payAddressExtraId = payment.payin_extra_id;

                // 4. 주소 정보 업데이트 (uid 기반)
                // TODO: Repository에 updateByUid 또는 이와 유사한 메서드 필요할 수 있음
                // 여기서는 간단히 persistence 객체 조작 후 update 호출 (id가 채워졌으므로)
                const updatedDeposit = DepositDetail.fromPersistence({
                    ...savedDeposit.toPersistence(),
                    walletAddress: payAddress,
                    walletAddressExtraId: payAddressExtraId,
                    providerPaymentId: payment.payment_id,
                } as any);

                await this.depositRepository.update(updatedDeposit);
            } catch (error) {
                // NowPayment 실패 시 로그만 남기고 우선 생성된 레코드는 유지
                // (관리자가 나중에 주소를 수동 할당하거나 실패 처리 가능)
            }
        }

        return {
            symbol: config.symbol,
            network: config.network,
            minDepositAmount: config.minDepositAmount.toString(),
            depositFeeRate: config.depositFeeRate.toString(),
            confirmations: config.confirmations,
            contractAddress: config.contractAddress,
            payAddress: payAddress || undefined,
            payAddressExtraId: payAddressExtraId,
            depositUid: savedDeposit.uid!,
        };
    }
}
