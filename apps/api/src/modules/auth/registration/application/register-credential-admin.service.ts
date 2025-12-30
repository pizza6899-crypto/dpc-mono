import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ActivityType } from 'src/common/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';
import { CountryUtil } from 'src/utils/country.util';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import {
  ReferralCodeNotFoundException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';
import { UserRoleType, UserStatus } from '@repo/database';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { CreateUserService } from 'src/modules/user/application/create-user.service';
import { UserAlreadyExistsException } from 'src/modules/user/domain/user.exception';

export interface RegisterCredentialAdminParams {
  email: string;
  password: string;
  role?: UserRoleType;
  country?: string;
  timezone?: string;
  referralCode?: string;
  requestInfo: RequestClientInfo;
}

export interface RegisterCredentialAdminResult {
  uid: string;
  email: string;
  role: UserRoleType;
  status: UserStatus;
}

/**
 * 어드민용 일반 회원가입 Use Case (이메일/비밀번호)
 * 어드민이 명시적으로 사용자를 생성할 때 사용
 */
@Injectable()
export class RegisterCredentialAdminService {
  private readonly logger = new Logger(RegisterCredentialAdminService.name);

  constructor(
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly vipMembershipService: VipMembershipService,
    private readonly linkReferralService: LinkReferralService,
    private readonly findCodeByCodeService: FindCodeByCodeService,
    private readonly createUserService: CreateUserService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    params: RegisterCredentialAdminParams,
  ): Promise<RegisterCredentialAdminResult> {
    const {
      email,
      password,
      role = UserRoleType.USER,
      country: providedCountry,
      timezone: providedTimezone,
      referralCode,
      requestInfo,
    } = params;

    // 1. 레퍼럴 코드 사전 검증 (사용자 생성 전)
    // 유효하지 않은 레퍼럴 코드인 경우 회원가입을 취소
    if (referralCode) {
      const code = await this.findCodeByCodeService.execute({
        code: referralCode,
      });

      if (!code) {
        throw new ReferralCodeNotFoundException(referralCode);
      }

      // 코드 활성화 확인
      if (!code.isActive) {
        throw new ReferralCodeInactiveException(code.code);
      }

      // 코드 만료 확인
      if (code.isExpired()) {
        throw new ReferralCodeExpiredException(code.code);
      }
    }

    // 2. 국가코드 기반 타임존 및 통화 설정
    // 어드민이 명시적으로 지정한 경우 우선 사용, 없으면 requestInfo 사용
    const country = providedCountry || requestInfo.country;
    const timezone = providedTimezone || requestInfo.timezone;

    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: country,
      timezone,
    });

    // 3. 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    // 4. 사용자 생성 (user 모듈의 유즈케이스 사용, 어드민이 지정한 role 사용)
    let user;
    try {
      const result = await this.createUserService.execute({
        email,
        passwordHash,
        socialId: null,
        socialType: null,
        role, // 어드민이 지정한 role 사용
        country: country,
        timezone: countryConfig.timezone,
      });
      user = result.user;
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw new ApiException(
          MessageCode.USER_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }

    // 5. VIP 멤버십 생성 (일반 사용자만)
    if (role === UserRoleType.USER) {
      await this.vipMembershipService.getOrCreateMembership(user.id);
    }

    // 6. 레퍼럴 코드가 제공된 경우 레퍼럴 관계 생성
    // 사전 검증을 통과했으므로 여기서는 셀프 추천 및 중복 레퍼럴만 체크됨
    if (referralCode) {
      await this.linkReferralService.execute({
        subUserId: user.id,
        referralCode,
        ipAddress: requestInfo.ip,
        deviceFingerprint: requestInfo.fingerprint,
        userAgent: requestInfo.userAgent,
        requestInfo, // Activity Log용
      });
    }

    // 7. 액티비티 로그
    try {
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.USER_REGISTER,
          description: `User registered by admin - role: ${role}`,
          metadata: {
            registeredBy: 'admin',
            role,
            country,
          },
        },
        requestInfo,
      );
    } catch (error) {
      // 액티비티 로그 실패는 회원가입 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Activity log 기록 실패 (회원가입은 성공) - userId: ${user.id}`,
      );
    }

    return {
      uid: user.uid,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}

