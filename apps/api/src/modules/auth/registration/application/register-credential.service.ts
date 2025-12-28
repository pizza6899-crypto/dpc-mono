import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { hashPassword } from 'src/utils/password.util';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { CountryUtil } from 'src/utils/country.util';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { EnvService } from 'src/platform/env/env.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { UserRoleType } from '@repo/database';
import { RegistrationPolicy } from '../domain';
import { USER_REPOSITORY, type UserRepositoryPort } from '../ports/out';

export interface RegisterCredentialParams {
  email: string;
  password: string;
  referralCode?: string;
  requestInfo: RequestClientInfo;
}

export interface RegisterCredentialResult {
  id: string;
  email: string;
}

/**
 * 일반 회원가입 Use Case (이메일/비밀번호)
 */
@Injectable()
export class RegisterCredentialService {
  private readonly logger = new Logger(RegisterCredentialService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly vipMembershipService: VipMembershipService,
    private readonly envService: EnvService,
    private readonly linkReferralService: LinkReferralService,
    private readonly registrationPolicy: RegistrationPolicy,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    params: RegisterCredentialParams,
  ): Promise<RegisterCredentialResult> {
    const { email, password, referralCode, requestInfo } = params;
    const { country, timezone } = requestInfo;

    // 1. 이메일 중복 확인 (도메인 레이어 사용)
    const existingUser = await this.userRepository.findByEmail(email);

    if (!this.registrationPolicy.canRegister(existingUser)) {
      throw new ApiException(
        MessageCode.USER_ALREADY_EXISTS,
        400, // HttpStatus.BAD_REQUEST
      );
    }

    // 2. 에이전트 코드 확인 및 에이전트 아이디 조회
    const referrerId: string | null = null;
    const signupCodeId: number | null = null;

    // 국가코드 기반 타임존 및 통화
    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: country,
      timezone,
    });

    // 3. 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      socialId: null,
      socialType: null,
      role: UserRoleType.USER,
      agentId: referrerId,
      country: country,
      timezone: countryConfig.timezone,
      balances: this.envService.wallet.allowedCurrencies.map((currency) => ({
        currency,
      })),
    });

    // 5. VIP 멤버십 생성
    await this.vipMembershipService.getOrCreateMembership(user.id);

    // 6. 레퍼럴 코드가 제공된 경우 레퍼럴 관계 생성
    if (referralCode) {
      try {
        await this.linkReferralService.execute({
          subUserId: user.id,
          referralCode,
          ipAddress: requestInfo.ip,
          deviceFingerprint: requestInfo.fingerprint,
          userAgent: requestInfo.userAgent,
          requestInfo, // Activity Log용
        });
        this.logger.log(
          `레퍼럴 관계 생성 성공 - 사용자: ${user.id}, 레퍼럴 코드: ${referralCode}`,
        );
      } catch (error) {
        // 레퍼럴 처리 실패 시에도 회원가입은 성공하도록 처리
        // (잘못된 레퍼럴 코드, 중복 레퍼럴 등)
        this.logger.warn(
          `레퍼럴 관계 생성 실패 - 사용자: ${user.id}, 레퍼럴 코드: ${referralCode}, 오류: ${error.message}`,
        );
        // 에러를 다시 throw하지 않음 - 회원가입은 정상 완료
      }
    }

    // 7. 액티비티 로그 (부가 기능이므로 실패해도 회원가입은 성공 처리)
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
      id: user.id,
      email: user.email,
    };
  }
}
