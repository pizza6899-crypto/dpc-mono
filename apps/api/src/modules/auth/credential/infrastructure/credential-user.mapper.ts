import { Injectable } from '@nestjs/common';
import { CredentialUser } from '../domain';

@Injectable()
export class CredentialUserMapper {
  /**
   * Prisma 모델을 도메인 엔티티로 변환
   * @description DB에서 조회한 데이터를 도메인 엔티티로 변환할 때 사용
   */
  toDomain(prismaModel: any): CredentialUser {
    return CredentialUser.fromPersistence({
      id: prismaModel.id,
      email: prismaModel.email,
      nickname: prismaModel.nickname,
      passwordHash: prismaModel.passwordHash,
      status: prismaModel.status,
      role: prismaModel.role,
      language: prismaModel.language,
      isEmailVerified: prismaModel.isEmailVerified,
      isPhoneVerified: prismaModel.isPhoneVerified,
      isIdentityVerified: prismaModel.isIdentityVerified,
      isKycMandatory: prismaModel.isKycMandatory,
      primaryCurrency: prismaModel.primaryCurrency,
      playCurrency: prismaModel.playCurrency,
      timezone: prismaModel.timezone,
      avatarUrl: prismaModel.avatarUrl,
      registrationMethod: prismaModel.registrationMethod,
    });
  }
}
