// src/modules/user/profile/infrastructure/user.mapper.ts
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
      loginId: prismaModel.loginId,
      nickname: prismaModel.nickname,
      email: prismaModel.email,
      passwordHash: prismaModel.passwordHash,
      registrationMethod: prismaModel.registrationMethod,
      telegramUsername: prismaModel.telegramUsername,
      oauthProvider: prismaModel.oauthProvider,
      oauthId: prismaModel.oauthId,
      phoneNumber: prismaModel.phoneNumber,
      status: prismaModel.status,
      role: prismaModel.role,
      country: prismaModel.country,
      language: prismaModel.language || 'KO', // Language enum의 기본값을 확보
      timezone: prismaModel.timezone,
      timezoneOffset: prismaModel.timezoneOffset,
      primaryCurrency: prismaModel.primaryCurrency,
      playCurrency: prismaModel.playCurrency,
      isEmailVerified: prismaModel.isEmailVerified,
      isPhoneVerified: prismaModel.isPhoneVerified,
      isTelegramVerified: prismaModel.isTelegramVerified,
      isIdentityVerified: prismaModel.isIdentityVerified,
      isBankVerified: prismaModel.isBankVerified,
      isKycMandatory: prismaModel.isKycMandatory,
      whitecliffId: prismaModel.whitecliffId,
      whitecliffUsername: prismaModel.whitecliffUsername,
      dcsId: prismaModel.dcsId,
      closedAt: prismaModel.closedAt,
      closedBy: prismaModel.closedBy,
      closeReason: prismaModel.closeReason,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: User): any {
    return domain.toPersistence();
  }

  /**
   * CreateUserParams를 Prisma create data로 변환
   */
  toPrismaCreateData(params: CreateUserParams): any {
    return {
      loginId: params.loginId,
      nickname: params.nickname,
      email: params.email,
      passwordHash: params.passwordHash,
      registrationMethod: params.registrationMethod,
      telegramUsername: params.telegramUsername,
      oauthProvider: params.oauthProvider,
      oauthId: params.oauthId,
      phoneNumber: params.phoneNumber,
      role: params.role,
      status: params.status,
      country: params.country,
      language: params.language,
      timezone: params.timezone,
      timezoneOffset: params.timezoneOffset,
      primaryCurrency: params.primaryCurrency,
      playCurrency: params.playCurrency,
    };
  }
}
