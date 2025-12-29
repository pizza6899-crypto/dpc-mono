import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { hashPassword } from 'src/utils/password.util';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

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
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
    private readonly dispatchLogService: DispatchLogService,
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

    // 7. Activity Log 기록
    try {
      await this.activityLog.logSuccess(
        {
          userId: tokenData.userId,
          activityType: ActivityType.PASSWORD_RESET,
          description: `비밀번호 재설정 완료 (토큰 사용)`,
          metadata: {
            tokenId: tokenData.id,
          },
        },
        requestInfo,
      );
    } catch (error) {
      // Activity Log 실패는 비밀번호 재설정 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Activity log 기록 실패 (비밀번호 재설정은 성공) - userId: ${tokenData.userId}`,
      );
    }

    // 8. Audit 로그 기록 (보안 로그)
    try {
      await this.dispatchLogService.dispatch({
        type: LogType.AUTH,
        data: {
          userId: tokenData.userId.toString(),
          action: 'PASSWORD_RESET',
          status: 'SUCCESS',
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent,
          metadata: {
            email: user.email,
            tokenId: tokenData.id,
          },
        },
      });
    } catch (error) {
      // Audit 로그 실패는 비밀번호 재설정 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Audit log 기록 실패 (비밀번호 재설정은 성공) - userId: ${tokenData.userId}`,
      );
    }
  }
}


