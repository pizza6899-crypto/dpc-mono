import { Module } from '@nestjs/common';
import { DefineAbilitiesService } from './application/define-abilities.service';
import { CaslPolicy } from './domain';
import { CaslAbilityFactory } from './infrastructure/casl-ability.factory';
import { CaslAbilityGuard } from './guards/casl-ability.guard';

/**
 * CASL 권한 관리 모듈
 *
 * 역할 기반 접근 제어(RBAC)를 CASL 라이브러리를 통해 구현합니다.
 */
@Module({
  providers: [
    // Domain Policy
    CaslPolicy,

    // Infrastructure
    CaslAbilityFactory,

    // Application Service
    DefineAbilitiesService,

    // Guards
    CaslAbilityGuard,
  ],
  exports: [
    DefineAbilitiesService,
    CaslAbilityFactory,
    CaslAbilityGuard,
    CaslPolicy,
  ],
})
export class CaslModule {}

