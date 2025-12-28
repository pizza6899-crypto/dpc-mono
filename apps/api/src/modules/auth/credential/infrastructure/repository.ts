import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { LoginAttemptRepositoryPort } from '../ports/login-attempt.repository.port';
import { LoginAttempt, LoginFailedException } from '../domain';
import { LoginAttemptMapper } from './mapper';

@Injectable()
export class LoginAttemptRepository implements LoginAttemptRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: LoginAttemptMapper,
  ) {}

  async create(attempt: LoginAttempt): Promise<LoginAttempt> {
    const data = this.mapper.toPrisma(attempt);
    const result = await this.tx.loginAttempt.create({ data });
    return this.mapper.toDomain(result);
  }

  async findByUid(uid: string): Promise<LoginAttempt | null> {
    const result = await this.tx.loginAttempt.findUnique({ where: { uid } });
    return result ? this.mapper.toDomain(result) : null;
  }

  async getByUid(uid: string): Promise<LoginAttempt> {
    const attempt = await this.findByUid(uid);
    if (!attempt) {
      throw new LoginFailedException(`Login attempt not found for UID: ${uid}`);
    }
    return attempt;
  }

  async findById(id: bigint): Promise<LoginAttempt | null> {
    const result = await this.tx.loginAttempt.findUnique({ where: { id } });
    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(id: bigint): Promise<LoginAttempt> {
    const attempt = await this.findById(id);
    if (!attempt) {
      throw new LoginFailedException(`Login attempt not found for ID: ${id}`);
    }
    return attempt;
  }

  async listRecent(params: {
    email?: string;
    ipAddress?: string;
    limit: number;
  }): Promise<LoginAttempt[]> {
    const { email, ipAddress, limit } = params;
    const results = await this.tx.loginAttempt.findMany({
      where: {
        AND: [email ? { email } : {}, ipAddress ? { ipAddress } : {}],
      },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
    });
    return results.map((result) => this.mapper.toDomain(result));
  }
}
