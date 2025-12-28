import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { CredentialUserRepositoryPort } from '../ports/out';
import { CredentialUser } from '../domain';
import { CredentialUserMapper } from './credential-user.mapper';

@Injectable()
export class CredentialUserRepository implements CredentialUserRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: CredentialUserMapper,
  ) {}

  async findByEmail(email: string): Promise<CredentialUser | null> {
    const result = await this.tx.user.findFirst({
      where: { email },
    });
    return result ? this.mapper.toDomain(result) : null;
  }
}
