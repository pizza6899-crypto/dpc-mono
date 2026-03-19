import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CountryUtil } from 'src/utils/country.util';
import { UserRoleType, UserStatus, RegistrationMethod } from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { IdUtil } from 'src/utils/id.util';

export interface RegisterAdminParams {
  email: string;
  password: string;
  loginId?: string;
  nickname?: string;
  role?: UserRoleType;
  country?: string;
  timezone?: string;
  referralCode?: string;
  requestInfo: RequestClientInfo;
}

export interface RegisterAdminResult {
  id: bigint;
  email: string | null;
  role: UserRoleType;
  status: UserStatus;
}

/**
 * 관리자에 의한 사용자 생성 서비스
 */
@Injectable()
export class RegisterAdminService {
  private readonly logger = new Logger(RegisterAdminService.name);

  constructor(
    private readonly dispatchLogService: DispatchLogService,
    private readonly createUserService: CreateUserService,
    private readonly getUserConfigService: GetUserConfigService,
  ) {}

  @Transactional()
  async execute(params: RegisterAdminParams): Promise<RegisterAdminResult> {
    const {
      email,
      password,
      loginId: providedLoginId,
      nickname: providedNickname,
      role = UserRoleType.USER,
      country: providedCountry,
      timezone: providedTimezone,
      referralCode,
      requestInfo,
    } = params;

    // 0. 가입 정책 및 기본 설정 조회
    const config = await this.getUserConfigService.execute();

    // 1. 지역 설정
    const country = providedCountry || requestInfo.country;
    const timezone = providedTimezone || requestInfo.timezone;
    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: country,
      timezone,
    });

    // 2. 비밀번호 해싱 및 기본값 설정
    const passwordHash = await hashPassword(password);
    const loginId = providedLoginId || email;
    const nickname =
      providedNickname || `user_${IdUtil.generateUrlSafeNanoid(6)}`;

    // 3. 사용자 생성
    const { user } = await this.createUserService.execute({
      loginId,
      nickname,
      email,
      passwordHash,
      registrationMethod: RegistrationMethod.ADMIN,
      role,
      country,
      timezone: countryConfig.timezone,
      primaryCurrency: config.defaultPrimaryCurrency,
      playCurrency: config.defaultPlayCurrency,
    });

    // 4. Audit 로그
    await this.logActivity(
      user,
      role,
      country || 'Unknown',
      referralCode,
      requestInfo,
    );

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private async logActivity(
    user: any,
    role: UserRoleType,
    country: string,
    referralCode: string | undefined,
    requestInfo: RequestClientInfo,
  ) {
    try {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.AUTH,
          data: {
            userId: user.id.toString(),
            action: 'ADMIN_USER_REGISTER',
            status: 'SUCCESS',
            metadata: {
              registeredBy: 'admin',
              role,
              country,
              referralCode: referralCode || null,
            },
          },
        },
        requestInfo,
      );
    } catch (error) {
      this.logger.error(`Audit log failed: ${error.message}`);
    }
  }
}
