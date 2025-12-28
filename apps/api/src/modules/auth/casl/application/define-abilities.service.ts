import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { CaslPolicy } from '../domain';
import { CaslAbilityFactory } from '../infrastructure/casl-ability.factory';
import type { Ability } from '@casl/ability';

/**
 * 사용자별 권한 정의 Use Case
 *
 * 사용자의 역할에 따라 권한을 정의하고 CASL Ability를 생성합니다.
 */
@Injectable()
export class DefineAbilitiesService {
  constructor(
    private readonly policy: CaslPolicy,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  /**
   * 사용자별 권한 정의 및 Ability 생성
   *
   * @param user - 인증된 사용자
   * @returns CASL Ability 객체
   */
  async execute(user: AuthenticatedUser): Promise<Ability> {
    // 1. 역할별 권한 정의
    const permissions = this.policy.defineRolePermissions(user.role);

    // 2. CASL Ability 생성
    return this.abilityFactory.create(user, permissions);
  }
}

