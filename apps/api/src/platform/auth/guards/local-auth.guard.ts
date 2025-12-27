import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. LocalStrategy로 인증 수행
    const result = await super.canActivate(context);

    if (result && request.user) {
      // 2. 세션에 사용자 저장 (이게 핵심!)
      return new Promise((resolve, reject) => {
        request.login(request.user as any, (err) => {
          if (err) {
            console.error('❌ Login error:', err);
            reject(err);
          } else {
            console.log('✅ User logged in and session saved');
            resolve(true);
          }
        });
      });
    }

    return false;
  }
}
