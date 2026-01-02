import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VerifyCredentialService } from './verify-credential.service';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';

export interface ChangePasswordParams {
  userId: bigint;
  currentPassword: string;
  newPassword: string;
  requestInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 비밀번호 변경 Use Case
 *
 * 로그인한 사용자가 현재 비밀번호를 알고 있는 상태에서 비밀번호를 변경합니다.
 */
@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly verifyService: VerifyCredentialService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: ChangePasswordParams): Promise<void> {
    const { userId, currentPassword, newPassword, requestInfo, isAdmin = false } = params;

    // 1. 사용자 조회
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiException(
        MessageCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. 일반 회원가입 사용자인지 확인
    if (!user.isCredentialUser()) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. 현재 비밀번호 검증
    const authInfo = user.getAuthInfo();
    if (!authInfo.passwordHash) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValidPassword = await this.verifyService.execute({
      email: user.email,
      password: currentPassword,
      isAdmin,
    });

    if (!isValidPassword) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 4. 새 비밀번호 해싱
    const newPasswordHash = await hashPassword(newPassword);

    // 5. 비밀번호 업데이트
    await this.userRepository.updatePassword(userId, newPasswordHash);
  }
}

