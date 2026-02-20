import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { InvalidPasswordResetTokenException } from '../domain/exception';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
  requestInfo: RequestClientInfo;
}

/**
 * 비밀번호 재설정 Use Case
 *
 * 이메일로 받은 토큰을 사용하여 비밀번호를 재설정합니다.
 */
@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepository: PasswordResetTokenRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: ResetPasswordParams): Promise<void> {
    const { token, newPassword, requestInfo } = params;

    // 1. 토큰 조회 및 검증
    const tokenData = await this.tokenRepository.findByToken(token);
    if (!tokenData) {
      throw new InvalidPasswordResetTokenException();
    }

    // 2. 사용자 조회
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new UserNotFoundException(tokenData.userId.toString());
    }

    // 3. 일반 회원가입 사용자인지 확인
    if (!user.isCredentialUser()) {
      throw new InvalidPasswordResetTokenException();
    }

    // 4. 새 비밀번호 해싱
    const passwordHash = await hashPassword(newPassword);

    // 5. 비밀번호 업데이트
    await this.userRepository.updatePassword(tokenData.userId, passwordHash);

    // 6. 토큰 사용 처리
    await this.tokenRepository.markAsUsed(tokenData.id);
  }
}
