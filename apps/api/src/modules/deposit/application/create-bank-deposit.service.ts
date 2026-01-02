import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, DepositMethodType, ExchangeCurrencyCode, PaymentProvider } from '@repo/database';
import { createId } from '@paralleldrive/cuid2';
import {
    DEPOSIT_DETAIL_REPOSITORY,
    BANK_CONFIG_REPOSITORY,
} from '../ports/out';
import type {
    DepositDetailRepositoryPort,
    BankConfigRepositoryPort,
} from '../ports/out';
import { DepositDetail, DepositMethod, DepositAmount } from '../domain';
import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
import { CreateBankDepositRequestDto } from '../dtos/create-bank-deposit-request.dto';

interface CreateBankDepositParams extends CreateBankDepositRequestDto {
    userId: bigint;
    ipAddress?: string;
    deviceFingerprint?: string;
}

@Injectable()
export class CreateBankDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly bankConfigRepository: BankConfigRepositoryPort,
    ) { }

    async execute(params: CreateBankDepositParams): Promise<CreateDepositResponseDto> {
        const {
            userId,
            payCurrency,
            amount,
            depositorName,
            ipAddress,
            deviceFingerprint,
        } = params;

        // 1. 활성화된 은행 계좌 조회
        const activeBanks = await this.bankConfigRepository.listActive(payCurrency as ExchangeCurrencyCode);

        if (activeBanks.length === 0) {
            throw new NotFoundException(`No active bank accounts found for ${payCurrency}`);
        }

        // 로드 밸런싱/우선순위 로직 (여기선 단순 첫 번째 선택)
        const selectedBank = activeBanks[0];
        const decimalAmount = new Prisma.Decimal(amount);

        if (!selectedBank.isAmountValid(decimalAmount)) {
            throw new BadRequestException(
                `Amount must be between ${selectedBank.minAmount} and ${selectedBank.maxAmount ?? 'unlimited'}`,
            );
        }

        // 2. DepositMethod 생성
        const depositMethod = DepositMethod.create(
            DepositMethodType.BANK_TRANSFER,
            PaymentProvider.MANUAL,
        );

        // 3. DepositAmount 생성
        const depositAmount = DepositAmount.create({
            requestedAmount: decimalAmount,
        });

        // 4. DepositDetail 생성
        const uid = createId();
        const depositDetail = DepositDetail.create({
            uid,
            userId,
            depositCurrency: payCurrency as ExchangeCurrencyCode,
            method: depositMethod,
            amount: depositAmount,
            bankConfigId: selectedBank.id!,
            depositorName,
            ipAddress,
            deviceFingerprint
        });

        // 5. 저장
        const savedDeposit = await this.depositRepository.create(depositDetail);

        // 6. 응답
        return {
            depositUid: savedDeposit.uid,
            payCurrency: savedDeposit.depositCurrency,
            bankName: selectedBank.bankName,
            accountNumber: selectedBank.accountNumber,
            accountHolder: selectedBank.accountHolder,
            transactionId: savedDeposit.transactionId?.toString(),
            isDuplicate: false,
        };
    }
}
