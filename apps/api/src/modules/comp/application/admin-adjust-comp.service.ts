import { Inject, Injectable } from '@nestjs/common';
import { CompTransactionType, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports';
import type { CompRepositoryPort } from '../ports';
import { FindCompAccountService } from './find-comp-account.service';
import { CompAccount, CompAccountTransaction } from '../domain';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class AdminAdjustCompService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        private readonly findCompAccountService: FindCompAccountService,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    @Transactional()
    async execute(params: {
        userId: bigint;
        adminId: bigint;
        currency: ExchangeCurrencyCode;
        amount: Prisma.Decimal;
        description: string;
    }): Promise<CompAccount> {
        let account = await this.findCompAccountService.execute(
            params.userId,
            params.currency,
        );

        if (account.id === BigInt(0)) {
            account = await this.compRepository.save(account);
        }

        const updatedAccount = account.adminAdjust(params.amount);
        const savedAccount = await this.compRepository.save(updatedAccount);

        const generated = this.snowflakeService.generate();
        const transactionId = generated.id;

        const transaction = CompAccountTransaction.create({
            id: transactionId,
            compAccountId: savedAccount.id,
            amount: params.amount,
            type: CompTransactionType.ADMIN,
            processedBy: params.adminId,
            description: params.description,
            createdAt: generated.timestamp,
        });

        await this.compRepository.createTransaction(transaction);

        return savedAccount;
    }
}
