// src/modules/user/application/create-user.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { User } from '../domain';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort, CreateUserParams } from '../ports/out/user.repository.port';
import { UserAlreadyExistsException } from '../domain/user.exception';

interface CreateUserServiceParams {
  email: string;
  passwordHash: string | null;
  socialId: string | null;
  socialType: CreateUserParams['socialType'];
  role: CreateUserParams['role'];
  country: string | null;
  timezone: string | null;
}

interface CreateUserServiceResult {
  user: User;
}

/**
 * 사용자 생성 Use Case
 *
 * 새로운 사용자를 생성합니다.
 * 일반 회원가입(이메일/비밀번호)과 소셜 회원가입을 모두 지원합니다.
 */
@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    params: CreateUserServiceParams,
  ): Promise<CreateUserServiceResult> {
    const { email, passwordHash, socialId, socialType, role, country, timezone } = params;

    // 1. 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    // 2. 소셜 ID 중복 확인 (소셜 회원가입인 경우)
    if (socialId) {
      const existingSocialUser = await this.userRepository.findBySocialId(socialId);
      if (existingSocialUser) {
        throw new UserAlreadyExistsException(email);
      }
    }

    // 3. 사용자 생성
    const user = await this.userRepository.create({
      email,
      passwordHash,
      socialId,
      socialType,
      role,
      country,
      timezone,
    });

    return {
      user,
    };
  }
}

