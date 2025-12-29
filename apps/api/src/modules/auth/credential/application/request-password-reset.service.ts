import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { MailService } from 'src/platform/mail/mail.service';
import { EmailType } from '@repo/database';
import { nanoid } from 'nanoid';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

export interface RequestPasswordResetParams {
  email: string;
  requestInfo: RequestClientInfo;
}

/**
 * 비밀번호 재설정 요청 Use Case
 *
 * 사용자가 비밀번호를 잊은 경우 이메일로 재설정 토큰을 발송합니다.
 * 보안을 위해 사용자가 존재하지 않아도 성공 응답을 반환합니다.
 */
@Injectable()
export class RequestPasswordResetService {
  private readonly logger = new Logger(RequestPasswordResetService.name);
  private readonly TOKEN_EXPIRY_HOURS = 1; // 1시간

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepository: PasswordResetTokenRepositoryPort,
    private readonly mailService: MailService,
  ) {}

  @Transactional()
  async execute(params: RequestPasswordResetParams): Promise<void> {
    const { email, requestInfo } = params;

    // 1. 사용자 조회
    const user = await this.userRepository.findByEmail(email);

    // 2. 보안을 위해 사용자가 없어도 성공 응답 반환 (타이밍 공격 방지)
    if (!user) {
      // 사용자가 없어도 일정 시간 대기 (타이밍 공격 방지)
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    }

    // 3. 일반 회원가입 사용자인지 확인
    if (!user.isCredentialUser()) {
      // 소셜 로그인 사용자는 비밀번호 재설정 불가
      return;
    }

    // 4. 기존 미사용 토큰 삭제
    await this.tokenRepository.deleteUnusedByUserId(user.id);

    // 5. 새 토큰 생성
    const token = nanoid(32); // 32자리 안전한 토큰
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    await this.tokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // 6. 이메일 발송
    try {
      const resetUrl = this.buildResetUrl(token);
      await this.mailService.sendMail({
        to: email,
        subject: '비밀번호 재설정 요청',
        html: this.buildEmailTemplate(resetUrl),
        text: `비밀번호 재설정을 위해 다음 링크를 클릭하세요: ${resetUrl}`,
        userId: user.id,
        emailType: EmailType.PASSWORD_RESET,
        metadata: {
          token: token.substring(0, 8) + '...', // 보안을 위해 일부만 기록
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (error) {
      // 이메일 발송 실패는 로깅만 하고 예외를 전파하지 않음 (보안)
      this.logger.error(
        `비밀번호 재설정 이메일 발송 실패 - email: ${email}, error: ${error}`,
      );
      // 사용자에게는 성공 응답을 반환 (보안)
    }
  }

  /**
   * 비밀번호 재설정 URL 생성
   */
  private buildResetUrl(token: string): string {
    // TODO: 프론트엔드 URL을 환경변수에서 가져오도록 수정 필요
    const baseUrl = process.env.FRONTEND_URL || 'https://example.com';
    return `${baseUrl}/reset-password?token=${token}`;
  }

  /**
   * 이메일 템플릿 생성
   */
  private buildEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>비밀번호 재설정 요청</h2>
          <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
          <p>이 링크는 1시간 동안만 유효합니다.</p>
          <a href="${resetUrl}" class="button">비밀번호 재설정</a>
          <p>또는 다음 링크를 복사하여 브라우저에 붙여넣으세요:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <div class="footer">
            <p>이 요청을 하지 않으셨다면 이 이메일을 무시하세요.</p>
            <p>보안을 위해 이 링크는 한 번만 사용할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}


