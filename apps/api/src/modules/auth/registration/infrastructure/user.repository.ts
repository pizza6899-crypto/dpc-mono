import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { UserRepositoryPort, CreateUserParams } from '../ports/out';
import { RegistrationUser } from '../domain';
import { UserMapper } from './user.mapper';

/**
 * User Repository Implementation
 *
 * Prisma를 사용한 UserRepositoryPort 구현체입니다.
 */
@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: UserMapper,
  ) {}

  async findByEmail(email: string): Promise<RegistrationUser | null> {
    const user = await this.tx.user.findFirst({
      where: { email },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findBySocialId(socialId: string): Promise<RegistrationUser | null> {
    const user = await this.tx.user.findFirst({
      where: { socialId },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async create(params: CreateUserParams): Promise<RegistrationUser> {
    const data = this.mapper.toPrismaCreateData(params);

    const user = await this.tx.user.create({
      data,
    });

    return this.mapper.toDomain(user);
  }
}
