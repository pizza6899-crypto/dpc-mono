import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { comparePassword, hashPassword } from 'src/utils/password.util';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { MailService } from 'src/platform/mail/mail.service';
import { EmailType, TokenType, UserStatus } from '@prisma/client';
import { nowUtc, nowUtcPlus } from 'src/utils/date.util';
import { IdUtil } from 'src/utils/id.util';
import { EnvService } from 'src/platform/env/env.service';
import { PasswordResetVerifyResponseDto } from '../dtos/password-reset-verify.dto';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 비밀번호 재설정 요청 (이메일 발송)
   */
  async requestPasswordReset(
    email: string,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return;
    }

    // 재설정 토큰 생성
    const resetToken = IdUtil.generateUrlSafeNanoid(32);
    const expiresAt = nowUtcPlus({
      minutes: 15,
    });

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        type: TokenType.PASSWORD_RESET,
        token: resetToken,
        expiresAt,
        metadata: {
          email,
        },
      },
    });

    // 이메일 발송
    const resetUrl = `${this.envService.app.frontendUrl}/auth/reset-password?token=${resetToken}`;

    await this.mailService.sendMail({
      emailType: EmailType.PASSWORD_RESET,
      userId: user.id,
      metadata: {
        resetUrl,
        resetToken,
        expiresAt: expiresAt.toISOString(),
      },
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You have requested to reset your password.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
      text: `
        Password Reset

        You have requested to reset your password.
        Please click the link below to reset your password:
        ${resetUrl}

        This link will expire in 15 minutes.
        If you did not request a password reset, please ignore this email.
      `,
    });

    // 액티비티 로그
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.PASSWORD_RESET_REQUEST,
        description: 'Password reset requested',
      },
      requestInfo,
    );
  }

  /**
   * 비밀번호 재설정 (토큰 검증 후)
   */
  async resetPassword(
    token: string,
    newPassword: string,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    // 토큰 검증
    const resetToken = await this.prisma.userToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
        expiresAt: { gt: nowUtc() },
        usedAt: null,
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            status: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!resetToken) {
      // 실패 로깅 (토큰이 유효하지 않음)
      // userId가 없을 수 있으므로 토큰에서 추출 시도
      const tokenInfo = await this.prisma.userToken.findUnique({
        where: { token },
        select: { userId: true },
      });

      if (tokenInfo?.userId) {
        await this.activityLog.logFailure(
          {
            userId: tokenInfo.userId,
            activityType: ActivityType.PASSWORD_RESET,
            description: 'Password reset failed: Invalid or expired token',
            metadata: { reason: 'invalid_token' },
          },
          requestInfo,
        );
      }

      throw new ApiException(
        MessageCode.PASSWORD_RESET_TOKEN_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = resetToken.user;

    // 사용자 상태 확인
    if (user.status !== UserStatus.ACTIVE) {
      // 실패 로깅 (계정 비활성)
      await this.activityLog.logFailure(
        {
          userId: user.id,
          activityType: ActivityType.PASSWORD_RESET,
          description: 'Password reset failed: Account is not active',
          metadata: { reason: 'account_inactive', status: user.status },
        },
        requestInfo,
      );

      throw new ApiException(
        MessageCode.AUTH_ACCOUNT_INACTIVE,
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.passwordHash) {
      const isSamePassword = await comparePassword(
        newPassword,
        user.passwordHash,
      );
      if (isSamePassword) {
        // 실패 로깅 (동일한 비밀번호)
        await this.activityLog.logFailure(
          {
            userId: user.id,
            activityType: ActivityType.PASSWORD_RESET,
            description: 'Password reset failed: New password same as current',
            metadata: { reason: 'same_password' },
          },
          requestInfo,
        );

        throw new ApiException(
          MessageCode.PASSWORD_SAME_AS_CURRENT,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const passwordHash = await hashPassword(newPassword);

    // 트랜잭션으로 비밀번호 업데이트 및 토큰 사용 처리
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.userToken.update({
        where: { id: resetToken.id },
        data: { usedAt: nowUtc() },
      });
    });

    // 성공 로깅
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.PASSWORD_RESET,
        description: 'Password reset successfully',
      },
      requestInfo,
    );
  }

  /**
   * 비밀번호 변경 (로그인 상태에서)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    if (currentPassword === newPassword) {
      await this.activityLog.logFailure(
        {
          userId,
          activityType: ActivityType.PASSWORD_CHANGE,
          description: 'Password change failed: New password same as current',
          metadata: { reason: 'same_password' },
        },
        requestInfo,
      );

      throw new ApiException(
        MessageCode.PASSWORD_SAME_AS_CURRENT,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, passwordHash: true },
        });

        if (!user || !user.passwordHash) {
          throw new ApiException(
            MessageCode.USER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        const isValidPassword = await comparePassword(
          currentPassword,
          user.passwordHash,
        );

        if (!isValidPassword) {
          throw new ApiException(
            MessageCode.AUTH_INVALID_CREDENTIALS,
            HttpStatus.UNAUTHORIZED,
          );
        }

        const passwordHash = await hashPassword(newPassword);

        await tx.user.update({
          where: { id: userId },
          data: { passwordHash },
        });
      });

      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.PASSWORD_CHANGE,
          description: 'Password changed successfully',
        },
        requestInfo,
      );
    } catch (error) {
      // 비밀번호 불일치 실패 로깅
      if (
        error instanceof ApiException &&
        error.messageCode === MessageCode.AUTH_INVALID_CREDENTIALS
      ) {
        await this.activityLog.logFailure(
          {
            userId,
            activityType: ActivityType.PASSWORD_CHANGE,
            description: 'Password change failed: Invalid current password',
            metadata: { reason: 'invalid_current_password' },
          },
          requestInfo,
        );
      }

      throw error;
    }
  }

  /**
   * 비밀번호 재설정 토큰 유효성 검증
   */
  async verifyResetToken(
    token: string,
  ): Promise<PasswordResetVerifyResponseDto> {
    const userToken = await this.prisma.userToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        usedAt: true,
        type: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!userToken) {
      return { valid: false };
    }

    if (userToken.type !== TokenType.PASSWORD_RESET) {
      return { valid: false };
    }

    // 사용자 상태 확인
    if (userToken.user.status !== UserStatus.ACTIVE) {
      return { valid: false };
    }

    if (userToken.usedAt) {
      return { valid: false, used: true };
    }

    if (userToken.expiresAt < new Date()) {
      return { valid: false };
    }

    return { valid: true, used: false };
  }
}
