import { Injectable, Inject } from '@nestjs/common';
import {
  type CredentialUserRepositoryPort,
  CREDENTIAL_USER_REPOSITORY,
} from '../ports/out';
import { comparePassword } from 'src/utils/password.util';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';

export interface VerifyCredentialParams {
  loginId: string;
  password: string;
  isAdmin?: boolean;
}

/**
 * 자격 증명(이메일/비밀번호) 검증 Use Case
 *
 * 타이밍 공격 방지를 위해 사용자가 없어도 비밀번호 검증을 수행합니다.
 */
@Injectable()
export class VerifyCredentialService {
  // 타이밍 공격 방지를 위한 더미 해시
  private readonly DUMMY_HASH =
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5';

  constructor(
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {}

  async execute({
    loginId,
    password,
    isAdmin = false,
  }: VerifyCredentialParams): Promise<AuthenticatedUser | null> {
    const user = await this.userRepository.findByLoginId(loginId);

    const hashToCompare = user?.passwordHash || this.DUMMY_HASH;
    const isValidPassword = await comparePassword(password, hashToCompare);

    if (!user || !user.passwordHash || !isValidPassword) {
      return null;
    }

    if (!user.isActive()) {
      return null;
    }

    if (isAdmin && !user.isAdmin()) {
      return null;
    }

    if (!isAdmin && user.isAdmin()) {
      return null;
    }

    if (!user.id) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isIdentityVerified: user.isIdentityVerified,
      isKycMandatory: user.isKycMandatory,
      language: user.language,
      primaryCurrency: user.primaryCurrency,
      playCurrency: user.playCurrency,
      timezone: user.timezone,
      avatarUrl: user.avatarUrl,
      registrationMethod: user.registrationMethod,
    };
  }
}
