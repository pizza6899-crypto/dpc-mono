import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { GetUserConfigService } from '../../config/application/get-user-config.service';
import { ThrottleService } from 'src/common/throttle/throttle.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from '@repo/shared';

/**
 * 전역 설정(UserConfig)을 기반으로 회원가입 제한을 검사하는 가드
 * 1. 회원가입 허용 여부 (allowSignup)
 * 2. IP당 일일 가입 제한 (maxDailySignupPerIp)
 */
@Injectable()
export class RegistrationLimitGuard implements CanActivate {
  constructor(
    private readonly getUserConfigService: GetUserConfigService,
    private readonly throttleService: ThrottleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // IP 추출 (Proxy 고려)
    const ip =
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    // 1. 전역 설정 조회
    const config = await this.getUserConfigService.execute();

    // 2. 회원가입 허용 여부 체크
    if (!config.allowSignup) {
      throw new ApiException(
        MessageCode.SIGNUP_DISABLED,
        HttpStatus.FORBIDDEN,
        'Registration is currently disabled.',
      );
    }

    // 3. IP당 일일 가입 제한 체크
    if (config.maxDailySignupPerIp > 0) {
      const key = `registration:daily:${ip}`;
      const result = await this.throttleService.checkLimit(key, {
        limit: config.maxDailySignupPerIp,
        ttl: 86400, // 24시간
      });

      if (!result.allowed) {
        throw new ApiException(
          MessageCode.SIGNUP_DAILY_LIMIT_EXCEEDED,
          HttpStatus.TOO_MANY_REQUESTS,
          `Daily registration limit exceeded for this IP. (Limit: ${config.maxDailySignupPerIp})`,
        );
      }
    }

    return true;
  }
}
