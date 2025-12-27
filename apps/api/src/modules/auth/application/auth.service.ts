import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { comparePassword, hashPassword } from 'src/utils/password.util';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { IdUtil } from 'src/utils/id.util';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { CountryUtil } from 'src/utils/country.util';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { RegisterDto } from '../dtos/register.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UserRoleType, UserStatus } from '@prisma/client';
import { EnvService } from 'src/platform/env/env.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly vipMembershipService: VipMembershipService,
    private readonly envService: EnvService,
    private readonly linkReferralService: LinkReferralService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role,
    };
  }

  async register(
    registerDto: RegisterDto,
    requestInfo: RequestClientInfo,
  ): Promise<AuthResponseDto> {
    const { email, password, referralCode } = registerDto;
    const { country, timezone } = requestInfo;

    // 1. 이메일 중복 확인
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ApiException(
        MessageCode.USER_ALREADY_EXISTS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2. 에이전트 코드 확인 및 에이전트 아이디 조회
    let referrerId: string | null = null;
    let signupCodeId: number | null = null;

    // 국가코드 기반 타임존 및 통화
    const countryConfig = CountryUtil.getCountryConfig({
      countryCode: country,
      timezone,
    });

    // 3. 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    const whitecliffId = await IdUtil.generateNextWhitecliffId(this.prisma);
    const whitecliffUsername = `wcf${whitecliffId}`;

    // 4. 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRoleType.USER,
        agentId: referrerId,
        balances: {
          create: this.envService.wallet.allowedCurrencies.map((currency) => ({
            currency,
          })),
        },
        whitecliffId: whitecliffId,
        whitecliffUsername: whitecliffUsername,

        country: country,
        timezone: countryConfig.timezone,
      },
    });

    await this.vipMembershipService.getOrCreateMembership(user.id);

    // 5. 레퍼럴 코드가 제공된 경우 레퍼럴 관계 생성
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

    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.USER_REGISTER,
        description: 'User registered successfully',
      },
      requestInfo,
    );

    return {
      id: user.id,
      email: registerDto.email,
    };
  }

  async validateAdmin(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // 관리자 역할 체크
    if (
      user.role !== UserRoleType.ADMIN &&
      user.role !== UserRoleType.SUPER_ADMIN
    ) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role,
    };
  }
}
