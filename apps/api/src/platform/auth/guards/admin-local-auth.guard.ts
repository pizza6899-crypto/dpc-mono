import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class AdminLocalAuthGuard extends AuthGuard('admin-local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. AdminLocalStrategy로 인증 수행
    const result = await super.canActivate(context);

    if (result && request.user) {
      // 2. 세션에 사용자 저장
      return new Promise((resolve, reject) => {
        request.login(request.user as any, (err) => {
          if (err) {
            console.error('❌ Admin login error:', err);
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
