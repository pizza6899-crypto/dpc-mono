import { Injectable, Inject } from '@nestjs/common';
import {
  type CredentialUserRepositoryPort,
  CREDENTIAL_USER_REPOSITORY,
} from '../ports/out';
import { comparePassword } from 'src/utils/password.util';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';

export interface VerifyCredentialParams {
  loginId: string;
  password: string;
  isAdmin?: boolean;
}

/**
 * 자격 증명(이메일/비밀번호) 검증 Use Case
 *
 * 타이밍 공격 방지를 위해 사용자가 없어도 비밀번호 검증을 수행합니다.
 * bcrypt.compare는 이미 상당한 시간(수십~수백 밀리초)이 소요되므로
 * 더미 해시로 검증하는 것만으로도 충분한 타이밍 공격 방지 효과가 있습니다.
 *
 * 참고: 고정된 딜레이는 공격자가 예측할 수 있어 효과가 제한적입니다.
 * bcrypt.compare의 가변적인 실행 시간이 더 자연스러운 보호를 제공합니다.
 */
@Injectable()
export class VerifyCredentialService {
  // 타이밍 공격 방지를 위한 더미 해시
  // 유효한 bcrypt 형식이어야 하며, 실제 사용자 해시와 유사한 길이를 가져야 함
  // '$2a$12$'는 bcryptjs의 표준 형식 (rounds=12)
  private readonly DUMMY_HASH =
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5';

  constructor(
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) { }

  async execute({
    loginId,
    password,
    isAdmin = false,
  }: VerifyCredentialParams): Promise<AuthenticatedUser | null> {
    const user = await this.userRepository.findByLoginId(loginId);

    // 타이밍 공격 방지: 사용자가 없어도 더미 해시로 비밀번호 검증 수행
    // bcrypt.compare는 이미 상당한 시간이 소요되므로 자연스러운 타이밍 공격 방지 효과
    // 고정된 딜레이보다 예측 불가능한 bcrypt 연산 시간이 더 효과적
    const hashToCompare = user?.passwordHash || this.DUMMY_HASH;
    const isValidPassword = await comparePassword(password, hashToCompare);

    // 사용자가 없거나 비밀번호가 틀린 경우
    if (!user || !user.passwordHash || !isValidPassword) {
      return null;
    }

    if (!user.isActive()) {
      return null;
    }

    // 관리자 로그인 시도인 경우 권한 체크
    if (isAdmin && !user.isAdmin()) {
      return null;
    }

    // 일반 사용자 로그인 시도인 경우 관리자 차단
    if (!isAdmin && user.isAdmin()) {
      return null;
    }

    // fromPersistence를 통해 생성된 엔티티는 항상 id가 있어야 함
    if (!user.id) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      language: user.language,
    };
  }
}
