// src/modules/deposit/infrastructure/deposit-detail.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { DepositDetail, DepositNotFoundException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetailMapper } from './deposit-detail.mapper';

/**
 * DepositDetail Repository Implementation
 *
 * Prisma를 사용한 DepositDetailRepositoryPort 구현체입니다.
 */
@Injectable()
export class DepositDetailRepository implements DepositDetailRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: DepositDetailMapper,
  ) {}

  async findById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findUnique({
      where: { id },
      include: {
        transaction: include?.transaction ?? false,
        BankConfig: include?.BankConfig ?? false,
        CryptoConfig: include?.CryptoConfig ?? false,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail> {
    const deposit = await this.findById(id, include);
    if (!deposit) {
      throw new DepositNotFoundException(id);
    }
    return deposit;
  }

  async update(deposit: DepositDetail): Promise<DepositDetail> {
    const updateData = this.mapper.toPrismaUpdate(deposit);

    const result = await this.tx.depositDetail.update({
      where: { id: deposit.id },
      data: updateData,
    });

    return this.mapper.toDomain(result);
  }

  async getTransactionUserId(transactionId: bigint): Promise<bigint | null> {
    const transaction = await this.tx.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    });

    return transaction?.userId ?? null;
  }
}

