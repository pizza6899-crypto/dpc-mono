import { Injectable, Inject } from '@nestjs/common';
import type { CredentialUserRepositoryPort } from '../ports/credential-user.repository.port';
import { CREDENTIAL_USER_REPOSITORY } from '../ports/credential-user.repository.token';
import { comparePassword } from 'src/utils/password.util';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';

export interface VerifyCredentialParams {
  email: string;
  password: string;
  isAdmin?: boolean;
}

/**
 * 자격 증명(이메일/비밀번호) 검증 Use Case
 */
@Injectable()
export class VerifyCredentialService {
  constructor(
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {}

  async execute({
    email,
    password,
    isAdmin = false,
  }: VerifyCredentialParams): Promise<AuthenticatedUser | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    if (!user.isActive()) {
      return null;
    }

    // 관리자 로그인 시도인 경우 권한 체크
    if (isAdmin && !user.isAdmin()) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
