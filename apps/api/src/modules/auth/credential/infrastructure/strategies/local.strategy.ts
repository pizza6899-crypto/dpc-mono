import { Injectable, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { VerifyCredentialService } from '../../application/verify-credential.service';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';

/**
 * Credential 모듈 전용 Local 전략 (User)
 *
 * VerifyCredentialService를 사용하여 이메일/비밀번호를 검증합니다.
 */
@Injectable()
export class CredentialLocalStrategy extends PassportStrategy(
  Strategy,
  'credential-local',
) {
  constructor(private readonly verifyService: VerifyCredentialService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.verifyService.execute({ email, password });

    if (!user) {
      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
