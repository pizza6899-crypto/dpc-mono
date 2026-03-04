import { Injectable } from '@nestjs/common';
import { LoginAttempt } from '../domain';

@Injectable()
export class LoginAttemptMapper {
  /**
   * Prisma 모델을 도메인 엔티티로 변환
   */
  toDomain(prismaModel: any): LoginAttempt {
    return LoginAttempt.fromPersistence({
      id: prismaModel.id,
      userId: prismaModel.userId,
      result: prismaModel.result,
      failureReason: prismaModel.failureReason,
      ipAddress: prismaModel.ipAddress,
      userAgent: prismaModel.userAgent,
      deviceFingerprint: prismaModel.deviceFingerprint,
      isMobile: prismaModel.isMobile,
      attemptedAt: prismaModel.attemptedAt,
      loginId: prismaModel.email,
      isAdmin: prismaModel.isAdmin,
    });
  }

  /**
   * 도메인 엔티티를 Prisma 데이터로 변환
   */
  toPrisma(domain: LoginAttempt): any {
    return {
      userId: domain.userId,
      result: domain.result,
      failureReason: domain.failureReason,
      ipAddress: domain.ipAddress,
      userAgent: domain.userAgent,
      deviceFingerprint: domain.deviceFingerprint,
      isMobile: domain.isMobile,
      attemptedAt: domain.attemptedAt,
      email: domain.loginId,
      isAdmin: domain.isAdmin,
    };
  }
}
