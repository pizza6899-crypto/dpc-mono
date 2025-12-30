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
import { UserRoleType } from '@repo/database';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { CreateUserService } from 'src/modules/user/application/create-user.service';
import { UserAlreadyExistsException } from 'src/modules/user/domain/user.exception';

export interface RegisterCredentialParams {
  email: string;
  password: string;
  referralCode?: string;
  requestInfo: RequestClientInfo;
}

export interface RegisterCredentialResult {
  uid: string;
  email: string;
}

/**
 * 일반 회원가입 Use Case (이메일/비밀번호)
 */
@Injectable()
export class RegisterCredentialService {
  private readonly logger = new Logger(RegisterCredentialService.name);

  constructor(
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly linkReferralService: LinkReferralService,
    private readonly findCodeByCodeService: FindCodeByCodeService,
    private readonly createUserService: CreateUserService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    params: RegisterCredentialParams,
  ): Promise<RegisterCredentialResult> {
    const { email, password, referralCode, requestInfo } = params;
    const { country, timezone } = requestInfo;

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
    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: country,
      timezone,
    });

    // 3. 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    // 4. 사용자 생성 (user 모듈의 유즈케이스 사용)
    let user;
    try {
      const result = await this.createUserService.execute({
        email,
        passwordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
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

    // 5. 레퍼럴 코드가 제공된 경우 레퍼럴 관계 생성
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

    // 6. 액티비티 로그 (부가 기능이므로 실패해도 회원가입은 성공 처리)
    try {
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.USER_REGISTER,
          description: 'User registered successfully',
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
    };
  }
}
