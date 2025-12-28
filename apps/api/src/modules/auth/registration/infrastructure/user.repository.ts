import { Injectable, Inject } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { UserRepositoryPort, CreateUserParams } from '../ports/out';
import { RegistrationUser } from '../domain';
import { UserMapper } from './user.mapper';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { IdUtil } from 'src/utils/id.util';

/**
 * User Repository Implementation
 *
 * Prisma를 사용한 UserRepositoryPort 구현체입니다.
 * 인프라스트럭처 레벨의 세부사항(whitecliffId 등)을 여기서 처리합니다.
 */
@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: UserMapper,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
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
    // 인프라스트럭처 레벨에서 whitecliffId 생성
    const whitecliffId = await IdUtil.generateNextWhitecliffId(this.prisma);
    const whitecliffUsername = `wcf${whitecliffId}`;

    const data = this.mapper.toPrismaCreateData(
      params,
      whitecliffId,
      whitecliffUsername,
    );

    const user = await this.tx.user.create({
      data,
    });

    return this.mapper.toDomain(user);
  }
}

