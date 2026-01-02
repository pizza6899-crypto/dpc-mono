import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Prisma, DepositMethodType, ExchangeCurrencyCode, PaymentProvider } from '@repo/database';
import { createId } from '@paralleldrive/cuid2';
import {
    DEPOSIT_DETAIL_REPOSITORY,
    CRYPTO_CONFIG_REPOSITORY,
} from '../ports/out';
import type {
    DepositDetailRepositoryPort,
    CryptoConfigRepositoryPort,
} from '../ports/out';
import { DepositDetail, DepositMethod, DepositAmount } from '../domain';
import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
import { CreateCryptoDepositRequestDto } from '../dtos/create-crypto-deposit-request.dto';

interface CreateCryptoDepositParams extends CreateCryptoDepositRequestDto {
    userId: bigint;
    ipAddress?: string;
    deviceFingerprint?: string;
}

@Injectable()
export class CreateCryptoDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly cryptoConfigRepository: CryptoConfigRepositoryPort,
    ) { }

    async execute(params: CreateCryptoDepositParams): Promise<CreateDepositResponseDto> {
        const {
            userId,
            payCurrency,
            payNetwork,
            amount,
            ipAddress,
            deviceFingerprint,
        } = params;

        // 1. 암호화폐 설정 조회 및 검증
        const cryptoConfig = await this.cryptoConfigRepository.findBySymbolAndNetwork(
            payCurrency,
            payNetwork,
        );

        if (!cryptoConfig || !cryptoConfig.isActive) {
            throw new BadRequestException(
                `Crypto deposit not available for ${payCurrency} on ${payNetwork}`,
            );
        }

        // TODO: 주소 생성 로직 (Wallet Module 연동 필요)
        const walletAddress: string | undefined = undefined;

        // 2. DepositMethod 생성
        const depositMethod = DepositMethod.create(
            DepositMethodType.CRYPTO_WALLET,
            PaymentProvider.MANUAL, // TODO: 적절한 Provider로 변경
        );

        // 3. DepositAmount 생성
        const depositAmount = DepositAmount.create({
            requestedAmount: amount ? new Prisma.Decimal(amount) : new Prisma.Decimal(0),
        });

        // 4. DepositDetail 생성
        const uid = createId();
        const depositDetail = DepositDetail.create({
            uid,
            userId,
            depositCurrency: payCurrency as ExchangeCurrencyCode,
            method: depositMethod,
            amount: depositAmount,
            cryptoConfigId: cryptoConfig.id,
            walletAddress,
            depositNetwork: payNetwork,
            ipAddress,
            deviceFingerprint
        });

        // 5. 저장
        const savedDeposit = await this.depositRepository.create(depositDetail);

        // 6. 응답
        return {
            depositUid: savedDeposit.uid,
            payAddress: savedDeposit.walletAddress ?? undefined,
            payCurrency: savedDeposit.depositCurrency,
            payNetwork: savedDeposit.depositNetwork ?? undefined,
            payAddressExtraId: savedDeposit.walletAddressExtraId,
            transactionId: savedDeposit.transactionId?.toString(),
            isDuplicate: false,
        };
    }
}
