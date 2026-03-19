import { UserConfig as PrismaUserConfig } from '@prisma/client';
import { UserConfig } from '../domain/model/user-config.entity';

export class UserConfigMapper {
  /**
   * DB 모델(Prisma)을 도메인 엔티티로 변환합니다.
   */
  static toDomain(record: PrismaUserConfig): UserConfig {
    return UserConfig.fromPersistence({
      id: record.id,
      allowSignup: record.allowSignup,
      defaultStatus: record.defaultStatus,
      maxDailySignupPerIp: record.maxDailySignupPerIp,
      loginIdType: record.loginIdType,
      requireEmail: record.requireEmail,
      requirePhoneNumber: record.requirePhoneNumber,
      requireBirthDate: record.requireBirthDate,
      requireNickname: record.requireNickname,
      requireReferralCode: record.requireReferralCode,
      allowedOAuthProviders: record.allowedOAuthProviders,
      loginIdEmailRegex: record.loginIdEmailRegex,
      loginIdPhoneNumberRegex: record.loginIdPhoneNumberRegex,
      loginIdUsernameRegex: record.loginIdUsernameRegex,
      nicknameRegex: record.nicknameRegex,
      passwordRegex: record.passwordRegex,
      defaultPrimaryCurrency: record.defaultPrimaryCurrency,
      defaultPlayCurrency: record.defaultPlayCurrency,
      defaultLanguage: record.defaultLanguage,
      adminNote: record.adminNote,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 엔티티의 현재 상태를 저장 가능한 데이터 객체로 변환합니다.
   */
  static toPersistence(entity: UserConfig) {
    return {
      allowSignup: entity.allowSignup,
      defaultStatus: entity.defaultStatus,
      maxDailySignupPerIp: entity.maxDailySignupPerIp,
      loginIdType: entity.loginIdType,
      requireEmail: entity.requireEmail,
      requirePhoneNumber: entity.requirePhoneNumber,
      requireBirthDate: entity.requireBirthDate,
      requireNickname: entity.requireNickname,
      requireReferralCode: entity.requireReferralCode,
      allowedOAuthProviders: entity.allowedOAuthProviders,
      loginIdEmailRegex: entity.loginIdEmailRegex,
      loginIdPhoneNumberRegex: entity.loginIdPhoneNumberRegex,
      loginIdUsernameRegex: entity.loginIdUsernameRegex,
      nicknameRegex: entity.nicknameRegex,
      passwordRegex: entity.passwordRegex,
      defaultPrimaryCurrency: entity.defaultPrimaryCurrency,
      defaultPlayCurrency: entity.defaultPlayCurrency,
      defaultLanguage: entity.defaultLanguage,
      adminNote: entity.adminNote,
      updatedBy: entity.updatedBy,
    };
  }
}
