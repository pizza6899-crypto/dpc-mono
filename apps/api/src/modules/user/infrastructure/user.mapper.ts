// src/modules/user/infrastructure/user.mapper.ts
import { Injectable } from '@nestjs/common';
import { User } from '../domain';
import type { User as PrismaUser } from '@prisma/client';
import type { CreateUserParams } from '../ports/out/user.repository.port';

/**
 * User Mapper
 *
 * Prisma User 엔티티와 Domain User 엔티티 간 변환을 담당합니다.
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지합니다.
 */
@Injectable()
export class UserMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: PrismaUser): User {
    return User.fromPersistence({
      id: prismaModel.id,
      email: prismaModel.email || '',
      passwordHash: prismaModel.passwordHash,
      socialId: prismaModel.socialId,
      socialType: prismaModel.socialType,
      status: prismaModel.status,
      role: prismaModel.role,
      country: prismaModel.country,
      timezone: prismaModel.timezone,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: User): {
    id: bigint;
    email: string;
    passwordHash: string | null;
    socialId: string | null;
    socialType: PrismaUser['socialType'];
    status: PrismaUser['status'];
    role: PrismaUser['role'];
    country: string | null;
    timezone: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      id: persistence.id,
      email: persistence.email,
      passwordHash: persistence.passwordHash,
      socialId: persistence.socialId,
      socialType: persistence.socialType,
      status: persistence.status,
      role: persistence.role,
      country: persistence.country,
      timezone: persistence.timezone,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }

  /**
   * CreateUserParams를 Prisma create data로 변환
   *
   * @param params - 도메인 레이어의 사용자 생성 파라미터
   */
  toPrismaCreateData(params: CreateUserParams) {
    return {
      email: params.email,
      passwordHash: params.passwordHash,
      socialId: params.socialId,
      socialType: params.socialType,
      role: params.role,
      country: params.country,
      timezone: params.timezone,
    };
  }
}

