import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { nanoid } from 'nanoid';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

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
  ) { }

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

    // TODO: 향후 노티피케이션 모듈로 대체
    // 현재는 Mock 처리 (개발 환경에서 토큰 확인용)
    this.logger.log(
      `[MOCK EMAIL] Password reset email sent to ${user.email}. Token: ${token} (expires: ${expiresAt.toISOString()})`,
    );
  }
}


