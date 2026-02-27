import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VerifyCredentialService } from './verify-credential.service';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import type { UserRepositoryPort } from 'src/modules/user/profile/ports/out/user.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/profile/ports/out/user.repository.token';
import { UserNotFoundException } from 'src/modules/user/profile/domain/user.exception';
import {
  PasswordMismatchException,
  LoginFailedException,
} from '../domain/exception';

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
  ) { }

  @Transactional()
  async execute(params: ChangePasswordParams): Promise<void> {
    const {
      userId,
      currentPassword,
      newPassword,
      requestInfo,
      isAdmin = false,
    } = params;

    // 1. 사용자 조회
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId.toString());
    }

    // 2. 일반 회원가입 사용자인지 확인
    if (!user.isFiatUser()) {
      throw new LoginFailedException('User is not a credential user');
    }

    // 3. 현재 비밀번호 검증
    const authInfo = user.getAuthInfo();
    if (!authInfo.passwordHash) {
      throw new LoginFailedException('User has no password set');
    }

    const isValidPassword = await this.verifyService.execute({
      email: user.email!, // isCredentialUser 체크를 통해 email 존재가 보장됨
      password: currentPassword,
      isAdmin,
    });

    if (!isValidPassword) {
      throw new PasswordMismatchException();
    }

    // 4. 새 비밀번호 해싱
    const newPasswordHash = await hashPassword(newPassword);

    // 5. 비밀번호 업데이트
    await this.userRepository.updatePassword(userId, newPasswordHash);
  }
}
