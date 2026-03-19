// src/modules/user/profile/infrastructure/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type {
  UserRepositoryPort,
  CreateUserParams,
  FindUsersParams,
  FindUsersResult,
} from '../ports/out/user.repository.port';
import { Prisma, OAuthProvider } from '@prisma/client';
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

  async findByLoginId(loginId: string): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: { loginId },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: { nickname },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: { phoneNumber },
    });

    return user ? this.mapper.toDomain(user) : null;
  }

  async findByOAuthId(
    provider: OAuthProvider,
    oauthId: string,
  ): Promise<User | null> {
    const user = await this.tx.user.findFirst({
      where: {
        oauthProvider: provider,
        oauthId: oauthId,
      },
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
      loginId,
      nickname,
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
      ...(loginId && {
        loginId: {
          contains: loginId,
          mode: 'insensitive',
        },
      }),
      ...(nickname && {
        nickname: {
          contains: nickname,
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
        loginId: data.loginId,
        nickname: data.nickname,
        email: data.email,
        passwordHash: data.passwordHash,
        registrationMethod: data.registrationMethod,
        oauthProvider: data.oauthProvider,
        oauthId: data.oauthId,
        status: data.status,
        role: data.role,
        country: data.country,
        language: data.language,
        timezone: data.timezone,
        timezoneOffset: data.timezoneOffset,
        primaryCurrency: data.primaryCurrency,
        playCurrency: data.playCurrency,
        birthDate: data.birthDate,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl,
        isEmailVerified: data.isEmailVerified,
        isPhoneVerified: data.isPhoneVerified,
        isTelegramVerified: data.isTelegramVerified,
        isIdentityVerified: data.isIdentityVerified,
        isBankVerified: data.isBankVerified,
        isKycMandatory: data.isKycMandatory,
        whitecliffId: data.whitecliffId,
        whitecliffUsername: data.whitecliffUsername,
        dcsId: data.dcsId,
        closedAt: data.closedAt,
        closedBy: data.closedBy,
        closeReason: data.closeReason,
      },
    });

    return this.mapper.toDomain(updated);
  }
}
