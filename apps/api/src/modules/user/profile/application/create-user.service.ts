import { Inject, Injectable, Logger, ConflictException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { User } from '../domain';
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
      registrationMethod,
      oauthId,
      oauthProvider,
    } = params;

    // 1. 로그인 ID 중복 확인 (필수)
    const existingByLoginId = await this.userRepository.findByLoginId(loginId);
    if (existingByLoginId) {
      throw new ConflictException(`이미 사용 중인 로그인 ID입니다: ${loginId}`);
    }

    // 2. 닉네임 중복 확인 (필수)
    const existingByNickname = await this.userRepository.findByNickname(nickname);
    if (existingByNickname) {
      throw new ConflictException(`이미 사용 중인 닉네임입니다: ${nickname}`);
    }

    // 3. 이메일 중복 확인 (있는 경우)
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new ConflictException(`이미 사용 중인 이메일입니다: ${email}`);
      }
    }

    // 4. OAuth ID 중복 확인 (소셜 가입인 경우)
    if (oauthProvider && oauthId) {
      const existingByOAuth = await this.userRepository.findByOAuthId(oauthProvider, oauthId);
      if (existingByOAuth) {
        throw new ConflictException(`이미 연동된 소셜 계정입니다.`);
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
