import { Injectable } from '@nestjs/common';
import { RegistrationUser } from '../domain';
import type { User } from '@repo/database';
import type { CreateUserParams } from '../ports/out';

/**
 * User Mapper
 *
 * Prisma User 엔티티와 Domain RegistrationUser 엔티티 간 변환을 담당합니다.
 */
@Injectable()
export class UserMapper {
  /**
   * Prisma User를 Domain RegistrationUser로 변환
   */
  toDomain(user: User): RegistrationUser {
    return RegistrationUser.fromPersistence({
      id: user.id,
      uid: user.uid,
      email: user.email || '',
      passwordHash: user.passwordHash,
      socialId: user.socialId,
      socialType: user.socialType,
      status: user.status,
      role: user.role,
    });
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
