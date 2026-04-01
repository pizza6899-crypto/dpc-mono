import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { User } from '../domain';
import {
  DuplicateLoginIdException,
  DuplicateNicknameException,
  DuplicateEmailException,
  DuplicateOAuthIdException,
  DuplicatePhoneNumberException,
  InvalidNicknameException,
  InvalidLoginIdException,
} from '../domain/user.exception';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import { type UserRepositoryPort } from '../ports/out/user.repository.port';
import {
  RegistrationMethod,
  UserRoleType,
  OAuthProvider,
  ExchangeCurrencyCode,
  LoginIdType,
} from '@prisma/client';
import { GetUserConfigService } from '../../config/application/get-user-config.service';
import { CreateAlertService } from 'src/modules/notification/alert/application/create-alert.service';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { InitializeUserTierService } from 'src/modules/tier/profile/application/initialize-user-tier.service';
import { InitializeUserWalletsService } from 'src/modules/wallet/application/initialize-user-wallets.service';
import { InitializeUserArtifactStatusService } from 'src/modules/artifact/status/application/initialize-user-artifact-status.service';

interface CreateUserServiceParams {
  loginId: string;
  nickname: string;
  email?: string | null;
  passwordHash?: string | null;
  registrationMethod: RegistrationMethod;
  oauthProvider?: OAuthProvider | null;
  oauthId?: string | null;
  phoneNumber?: string | null;
  telegramUsername?: string | null;
  birthDate?: Date | null;
  role?: UserRoleType;
  country?: string | null;
  timezone?: string | null;
  primaryCurrency?: ExchangeCurrencyCode;
  playCurrency?: ExchangeCurrencyCode;
}

interface CreateUserServiceResult {
  user: User;
}

/**
 * 사용자 생성 Use Case
 *
 * 새로운 사용자를 생성합니다.
 * 구체적인 가입 방식(CREDENTIAL, SOCIAL, ADMIN)에 따라 필요한 정보를 받아 처리합니다.
 */
@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly getUserConfigService: GetUserConfigService,
    private readonly createAlertService: CreateAlertService,
    private readonly initializeUserTierService: InitializeUserTierService,
    private readonly initializeUserWalletsService: InitializeUserWalletsService,
    private readonly initializeUserArtifactStatusService: InitializeUserArtifactStatusService,
  ) { }

  @Transactional()
  async execute(
    params: CreateUserServiceParams,
  ): Promise<CreateUserServiceResult> {
    const {
      loginId,
      nickname,
      email,
      phoneNumber,
      registrationMethod,
      oauthId,
      oauthProvider,
    } = params;

    // 0. 전역 설정(UserConfig)의 정규식 검증 적용
    const config = await this.getUserConfigService.execute();

    // 로그인 ID 형식 검증 (일반 가입 시에만)
    if (registrationMethod === RegistrationMethod.CREDENTIAL) {
      let loginIdRegex: string | null = null;
      if (config.loginIdType === LoginIdType.EMAIL)
        loginIdRegex = config.loginIdEmailRegex;
      else if (config.loginIdType === LoginIdType.PHONE_NUMBER)
        loginIdRegex = config.loginIdPhoneNumberRegex;
      else if (config.loginIdType === LoginIdType.USERNAME)
        loginIdRegex = config.loginIdUsernameRegex;

      if (loginIdRegex && !new RegExp(loginIdRegex).test(loginId)) {
        throw new InvalidLoginIdException();
      }
    }

    // 닉네임 형식 검증
    if (
      config.requireNickname &&
      config.nicknameRegex &&
      !new RegExp(config.nicknameRegex).test(nickname)
    ) {
      throw new InvalidNicknameException();
    }

    // 1. 로그인 ID 중복 확인 (필수)
    const existingByLoginId = await this.userRepository.findByLoginId(loginId);
    if (existingByLoginId) {
      throw new DuplicateLoginIdException();
    }

    // 2. 닉네임 중복 확인 (필수)
    const existingByNickname =
      await this.userRepository.findByNickname(nickname);
    if (existingByNickname) {
      throw new DuplicateNicknameException();
    }

    // 3. 이메일 중복 확인 (있는 경우)
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new DuplicateEmailException();
      }
    }

    // 4. 휴대폰 번호 중복 확인 (있는 경우)
    if (phoneNumber) {
      const existingByPhone =
        await this.userRepository.findByPhoneNumber(phoneNumber);
      if (existingByPhone) {
        throw new DuplicatePhoneNumberException();
      }
    }

    // 5. OAuth ID 중복 확인 (소셜 가입인 경우)
    if (oauthProvider && oauthId) {
      const existingByOAuth = await this.userRepository.findByOAuthId(
        oauthProvider,
        oauthId,
      );
      if (existingByOAuth) {
        throw new DuplicateOAuthIdException();
      }
    }

    // 5. 사용자 생성
    const user = await this.userRepository.create({
      ...params,
    });

    this.logger.log(`새로운 사용자 생성됨: ${user.loginId} (ID: ${user.id})`);

    // 6. 티어 초기화
    await this.initializeUserTierService.execute(user.id);

    // 7. 지갑 초기화
    await this.initializeUserWalletsService.execute(user.id);

    // 8. 유물 상태 초기화
    await this.initializeUserArtifactStatusService.execute(user.id);

    // 알림 발송
    await this.createAlertService.execute({
      event: NOTIFICATION_EVENTS.USER_REGISTERED,
      userId: user.id,
      payload: {},
      idempotencyKey: `user-register-${user.id}`,
    });

    return {
      user,
    };
  }
}
