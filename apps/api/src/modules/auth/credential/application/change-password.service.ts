import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VerifyCredentialService } from './verify-credential.service';
import { hashPassword } from 'src/utils/password.util';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

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
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
    private readonly dispatchLogService: DispatchLogService,
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
      // Audit 로그 기록 (비밀번호 변경 실패 - 현재 비밀번호 불일치)
      try {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.AUTH,
            data: {
              userId: userId.toString(),
              action: 'PASSWORD_CHANGE',
              status: 'FAILURE',
              ip: requestInfo.ip,
              userAgent: requestInfo.userAgent,
              metadata: {
                isAdmin,
                email: user.email,
                failureReason: 'INVALID_CURRENT_PASSWORD',
              },
            },
          },
          requestInfo,
        );
      } catch (error) {
        // Audit 로그 실패는 비밀번호 변경 실패 처리에 영향을 주지 않도록 처리
        this.logger.error(
          error,
          `Audit log 기록 실패 (비밀번호 변경 실패) - userId: ${userId}`,
        );
      }

      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 4. 새 비밀번호 해싱
    const newPasswordHash = await hashPassword(newPassword);

    // 5. 비밀번호 업데이트
    await this.userRepository.updatePassword(userId, newPasswordHash);

    // 6. Activity Log 기록
    try {
      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.PASSWORD_CHANGE,
          description: `비밀번호 변경 완료`,
          metadata: {
            isAdmin,
          },
        },
        requestInfo,
      );
    } catch (error) {
      // Activity Log 실패는 비밀번호 변경 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Activity log 기록 실패 (비밀번호 변경은 성공) - userId: ${userId}`,
      );
    }

    // 7. Audit 로그 기록 (보안 로그)
    try {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.AUTH,
          data: {
            userId: userId.toString(),
            action: 'PASSWORD_CHANGE',
            status: 'SUCCESS',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            metadata: {
              isAdmin,
              email: user.email,
            },
          },
        },
        requestInfo,
      );
    } catch (error) {
      // Audit 로그 실패는 비밀번호 변경 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Audit log 기록 실패 (비밀번호 변경은 성공) - userId: ${userId}`,
      );
    }
  }
}

