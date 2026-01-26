import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CompClaimHistoryRepositoryPort } from '../ports';
import { CompClaimHistory } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompClaimHistoryRepository implements CompClaimHistoryRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CompMapper,
    ) { }

    async save(history: CompClaimHistory): Promise<CompClaimHistory> {
        const data = this.mapper.toClaimHistoryPersistence(history);
        const result = await this.tx.compClaimHistory.upsert({
            where: { id: data.id ?? BigInt(0) }, // Use 0 for create if id is undefined/0
            create: {
                userId: data.userId!,
                status: data.status,
                failureReason: data.failureReason,
                compWalletTransactionId: data.compWalletTransactionId!,
                compAmount: data.compAmount!,
                compCurrency: data.compCurrency!,
                walletTransactionId: data.walletTransactionId,
                targetAmount: data.targetAmount!,
                targetCurrency: data.targetCurrency!,
                exchangeRate: data.exchangeRate!,
                claimedAt: data.claimedAt,
            },
            update: {
                status: data.status,
                failureReason: data.failureReason,
                walletTransactionId: data.walletTransactionId,
            }
        });
        return this.mapper.toClaimHistoryDomain(result);
    }

    async findById(id: bigint): Promise<CompClaimHistory | null> {
        const result = await this.tx.compClaimHistory.findUnique({
            where: { id },
        });
        return result ? this.mapper.toClaimHistoryDomain(result) : null;
    }

    async findByWalletTransactionId(walletTransactionId: bigint): Promise<CompClaimHistory | null> {
        const result = await this.tx.compClaimHistory.findUnique({
            where: { walletTransactionId },
        });
        return result ? this.mapper.toClaimHistoryDomain(result) : null;
    }
}
