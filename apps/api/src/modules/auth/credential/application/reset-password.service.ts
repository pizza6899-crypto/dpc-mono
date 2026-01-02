import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';

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
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. 사용자 조회
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new ApiException(
        MessageCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. 일반 회원가입 사용자인지 확인
    if (!user.isCredentialUser()) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. 새 비밀번호 해싱
    const passwordHash = await hashPassword(newPassword);

    // 5. 비밀번호 업데이트
    await this.userRepository.updatePassword(tokenData.userId, passwordHash);

    // 6. 토큰 사용 처리
    await this.tokenRepository.markAsUsed(tokenData.id);
  }
}


