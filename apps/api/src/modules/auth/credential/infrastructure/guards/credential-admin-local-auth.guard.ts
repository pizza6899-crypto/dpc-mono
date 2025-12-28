import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Credential 모듈 전용 Admin Local Auth Guard
 *
 * 'credential-admin-local' 전략을 사용하여 관리자 로그인을 처리합니다.
 */
@Injectable()
export class CredentialAdminLocalAuthGuard extends AuthGuard(
  'credential-admin-local',
) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. CredentialAdminLocalStrategy로 인증 수행
    const result = await super.canActivate(context);

    if (result && request.user) {
      // 2. 세션에 사용자 저장
      return new Promise((resolve, reject) => {
        request.login(request.user as any, (err) => {
          if (err) {
            console.error('❌ Credential admin login error:', err);
            reject(err);
          } else {
            console.log('✅ Admin logged in and session saved');
            resolve(true);
          }
        });
      });
    }

    return false;
  }
}

