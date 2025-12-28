import { Injectable, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../../application/auth.service';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';

/**
 * Credential 모듈 전용 Admin Local 전략
 *
 * 기존 AuthService.validateAdmin을 사용하여 관리자 이메일/비밀번호를 검증합니다.
 */
@Injectable()
export class CredentialAdminLocalStrategy extends PassportStrategy(
  Strategy,
  'credential-admin-local',
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.authService.validateAdmin(email, password);

    if (!user) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
