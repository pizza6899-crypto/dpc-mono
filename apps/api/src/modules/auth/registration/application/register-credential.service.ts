import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CountryUtil } from 'src/utils/country.util';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import {
  ReferralCodeNotFoundException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { UserRoleType } from '@repo/database';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { CreateUserService } from 'src/modules/user/application/create-user.service';
import { UserAlreadyExistsException } from 'src/modules/user/domain/user.exception';
import { CreateWalletService } from 'src/modules/wallet/application/create-wallet.service';

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
    private readonly dispatchLogService: DispatchLogService,
    private readonly linkReferralService: LinkReferralService,
    private readonly findCodeByCodeService: FindCodeByCodeService,
    private readonly createUserService: CreateUserService,
    private readonly createWalletService: CreateWalletService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) { }

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

      // 모든 지원 통화에 대해 월렛 생성 (동기)
      // WALLET_CURRENCIES에 정의된 모든 통화의 지갑을 생성합니다.
      await Promise.all(
        WALLET_CURRENCIES.map((currency) =>
          this.createWalletService.execute({
            userId: user.id,
            currency,
          }),
        ),
      );
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw error;
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

    // 6. Audit 로그 (부가 기능이므로 실패해도 회원가입은 성공 처리)
    try {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.AUTH,
          data: {
            userId: user.id.toString(),
            action: 'USER_REGISTER',
            status: 'SUCCESS',
            metadata: {
              registrationMethod: 'EMAIL',
              referralCode: referralCode || null,
            },
          },
        },
        requestInfo,
      );
    } catch (error) {
      // Audit 로그 실패는 회원가입 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Audit log 기록 실패 (회원가입은 성공) - userId: ${user.id}`,
      );
    }

    return {
      uid: user.uid,
      email: user.email,
    };
  }
}
