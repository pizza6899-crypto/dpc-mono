// src/modules/deposit/application/get-bank-deposit-address.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, PaymentProvider, DepositMethodType } from '@repo/database';
import { BANK_CONFIG_REPOSITORY, DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort, DepositDetailRepositoryPort } from '../ports/out';
import { BankConfigNotFoundException, DepositDetail, DepositMethod, DepositAmount } from '../domain';
import { BankDepositAddressResponseDto } from '../dtos/deposit-address-user.dto';
import { generateUid } from 'src/utils/id.util';

export interface GetBankDepositAddressParams {
    currency: string;
    userId: bigint;
    amount?: Prisma.Decimal;
    ipAddress?: string;
    deviceFingerprint?: string;
}

@Injectable()
export class GetBankDepositAddressService {
    constructor(
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly bankConfigRepository: BankConfigRepositoryPort,
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
    ) { }

    @Transactional()
    async execute({ currency, userId, amount, ipAddress, deviceFingerprint }: GetBankDepositAddressParams): Promise<BankDepositAddressResponseDto> {
        const configs = await this.bankConfigRepository.listActive(currency as ExchangeCurrencyCode);

        if (configs.length === 0) {
            throw new BankConfigNotFoundException(currency);
        }

        // 우선순위가 가장 높은 설정을 반환 (Repository에서 이미 정렬되어 있음)
        const config = configs[0];

        // 1. 입금 상세 엔티티 생성
        const deposit = DepositDetail.create({
            uid: generateUid(),
            userId,
            depositCurrency: currency as ExchangeCurrencyCode,
            method: DepositMethod.create(DepositMethodType.BANK_TRANSFER, PaymentProvider.MANUAL),
            amount: DepositAmount.create({
                requestedAmount: amount ?? new Prisma.Decimal(0),
            }),
            bankConfigId: config.id,
            ipAddress,
            deviceFingerprint,
        });

        // 2. DB 저장 (DepositDetail 생성)
        const savedDeposit = await this.depositRepository.create(deposit);

        return {
            bankName: config.bankName,
            accountNumber: config.accountNumber,
            accountHolder: config.accountHolder,
            description: config.description,
            depositUid: savedDeposit.uid!,
        };
    }
}
