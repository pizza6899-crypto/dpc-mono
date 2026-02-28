import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { CredentialUserRepositoryPort } from '../ports/out';
import { CredentialUser } from '../domain';
import { CredentialUserMapper } from './credential-user.mapper';

@Injectable()
export class CredentialUserRepository implements CredentialUserRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CredentialUserMapper,
  ) { }

  async findByLoginId(loginId: string): Promise<CredentialUser | null> {
    const result = await this.tx.user.findFirst({
      where: {
        OR: [{ loginId }, { email: loginId }],
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findById(id: bigint): Promise<CredentialUser | null> {
    const result = await this.tx.user.findUnique({
      where: { id },
    });
    return result ? this.mapper.toDomain(result) : null;
  }
}
