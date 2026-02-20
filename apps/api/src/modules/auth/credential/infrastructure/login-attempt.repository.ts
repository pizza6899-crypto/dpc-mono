import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { LoginAttemptRepositoryPort } from '../ports/out';
import { LoginAttempt } from '../domain';
import { LoginAttemptMapper } from './mapper';

@Injectable()
export class LoginAttemptRepository implements LoginAttemptRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: LoginAttemptMapper,
  ) {}

  async create(attempt: LoginAttempt): Promise<LoginAttempt> {
    const data = this.mapper.toPrisma(attempt);
    const result = await this.tx.loginAttempt.create({ data });
    return this.mapper.toDomain(result);
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
