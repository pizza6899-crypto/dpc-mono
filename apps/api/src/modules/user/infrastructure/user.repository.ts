// src/modules/user/infrastructure/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type {
  UserRepositoryPort,
  CreateUserParams,
  FindUsersParams,
  FindUsersResult,
} from '../ports/out/user.repository.port';
import { Prisma } from '@prisma/client';
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
  ) { }

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

  async findMany(params: FindUsersParams): Promise<FindUsersResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      email,
      role,
      status,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    // Where 조건 구성
    const where: Prisma.UserWhereInput = {
      ...(email && {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      }),
      ...(role && { role }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    // 정렬 조건 구성
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // 데이터 조회 및 총 개수 조회
    const [users, total] = await Promise.all([
      this.tx.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.tx.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.mapper.toDomain(user)),
      total,
    };
  }

  async create(params: CreateUserParams): Promise<User> {
    const data = this.mapper.toPrismaCreateData(params);

    const user = await this.tx.user.create({
      data,
    });

    return this.mapper.toDomain(user);
  }

  async updatePassword(userId: bigint, passwordHash: string): Promise<User> {
    const user = await this.tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return this.mapper.toDomain(user);
  }

  async save(user: User): Promise<User> {
    const data = user.toPersistence();

    const updated = await this.tx.user.update({
      where: { id: data.id },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        socialId: data.socialId,
        socialType: data.socialType,
        status: data.status,
        role: data.role,
        country: data.country,
        timezone: data.timezone,
        primaryCurrency: data.primaryCurrency,
        playCurrency: data.playCurrency,
      },
    });

    return this.mapper.toDomain(updated);
  }
}
