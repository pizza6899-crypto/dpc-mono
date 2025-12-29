// src/modules/user/infrastructure/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/platform/prisma/prisma.module';
import type { UserRepositoryPort, CreateUserParams } from '../ports/out/user.repository.port';
import { User } from '../domain';
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
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserMapper,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: { email },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findBySocialId(socialId: string): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: { socialId },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findById(id: bigint): Promise<User | null> {
    const user = await this.tx.user.findUnique({
      where: { id },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findByUid(uid: string): Promise<User | null> {
    const user = await this.tx.user.findUnique({
      where: { uid },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async create(params: CreateUserParams): Promise<User> {
    const data = this.mapper.toPrismaCreateData(params);

    const user = await this.tx.user.create({
      data,
    });

    return this.mapper.toDomain(user);
  }
}

