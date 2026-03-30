import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  RegistrationMethod,
  OAuthProvider,
  UserRoleType,
} from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { ThrottleService } from 'src/infrastructure/throttle/throttle.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from '@repo/shared';
import { CountryUtil } from 'src/utils/country.util';
import { IdUtil } from 'src/utils/id.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

export interface RegisterSocialUserParams {
  provider: OAuthProvider;
  oauthId: string;
  email?: string;
  referralCode?: string;
  requestInfo: RequestClientInfo;
}

@Injectable()
export class RegisterSocialUserService {
  private readonly logger = new Logger(RegisterSocialUserService.name);

  constructor(
    private readonly createUserService: CreateUserService,
    private readonly getUserConfigService: GetUserConfigService,
    private readonly throttleService: ThrottleService,
  ) {}

  @Transactional()
  async execute(params: RegisterSocialUserParams) {
    const { provider, oauthId, email, referralCode, requestInfo } = params;

    const config = await this.getUserConfigService.execute();

    if (!config.allowSignup) {
      throw new ApiException(MessageCode.SIGNUP_DISABLED, HttpStatus.FORBIDDEN);
    }

    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: requestInfo.country,
      timezone: requestInfo.timezone,
    });

    // 1. 사용자 생성
    const { user } = await this.createUserService.execute({
      registrationMethod: RegistrationMethod.SOCIAL,
      loginId: oauthId,
      oauthProvider: provider,
      oauthId,
      email,
      nickname: `user_${IdUtil.generateUrlSafeNanoid(6)}`,
      country: requestInfo.country,
      timezone: countryConfig.timezone,
      primaryCurrency: config.defaultPrimaryCurrency,
      playCurrency: config.defaultPlayCurrency,
      role: UserRoleType.USER,
    });

    // 2. 쓰로틀링
    if (config.maxDailySignupPerIp > 0) {
      await this.throttleService.checkAndIncrement(
        `registration:daily:${requestInfo.ip}`,
        {
          limit: config.maxDailySignupPerIp,
          ttl: 86400,
        },
      );
    }

    return {
      id: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      email: user.email,
    };
  }
}
