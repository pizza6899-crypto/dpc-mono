import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { User } from '../domain';
import {
  DuplicateLoginIdException,
  DuplicateNicknameException,
  DuplicateEmailException,
  DuplicateOAuthIdException,
  DuplicatePhoneNumberException,
} from '../domain/user.exception';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type {
  UserRepositoryPort,
} from '../ports/out/user.repository.port';
import { RegistrationMethod, UserRoleType, OAuthProvider, ExchangeCurrencyCode } from '@prisma/client';

interface CreateUserServiceParams {
  loginId: string;
  nickname: string;
  email?: string | null;
  passwordHash?: string | null;
  registrationMethod: RegistrationMethod;
  oauthProvider?: OAuthProvider | null;
  oauthId?: string | null;
  phoneNumber?: string | null;
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
 * 구체적인 가입 방식(FULL, OAUTH, QUICK 등)에 따라 필요한 정보를 받아 처리합니다.
 */
@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
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

    // 1. 로그인 ID 중복 확인 (필수)
    const existingByLoginId = await this.userRepository.findByLoginId(loginId);
    if (existingByLoginId) {
      throw new DuplicateLoginIdException(loginId);
    }

    // 2. 닉네임 중복 확인 (필수)
    const existingByNickname = await this.userRepository.findByNickname(nickname);
    if (existingByNickname) {
      throw new DuplicateNicknameException(nickname);
    }

    // 3. 이메일 중복 확인 (있는 경우)
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new DuplicateEmailException(email);
      }
    }

    // 4. 휴대폰 번호 중복 확인 (있는 경우)
    if (phoneNumber) {
      const existingByPhone = await this.userRepository.findByPhoneNumber(phoneNumber);
      if (existingByPhone) {
        throw new DuplicatePhoneNumberException(phoneNumber);
      }
    }

    // 5. OAuth ID 중복 확인 (소셜 가입인 경우)
    if (oauthProvider && oauthId) {
      const existingByOAuth = await this.userRepository.findByOAuthId(oauthProvider, oauthId);
      if (existingByOAuth) {
        throw new DuplicateOAuthIdException();
      }
    }

    // 5. 사용자 생성
    const user = await this.userRepository.create({
      ...params,
    });

    this.logger.log(`새로운 사용자 생성됨: ${user.loginId} (ID: ${user.id})`);

    return {
      user,
    };
  }
}
