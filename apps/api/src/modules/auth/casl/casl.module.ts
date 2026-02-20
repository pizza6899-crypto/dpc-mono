import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DefineAbilitiesService } from './application/define-abilities.service';
import { CaslPolicy } from './domain';
import { CaslAbilityFactory } from './infrastructure/casl-ability.factory';
import { CaslAbilityGuard } from './guards/casl-ability.guard';

/**
 * CASL 권한 관리 모듈
 *
 * 역할 기반 접근 제어(RBAC)를 CASL 라이브러리를 통해 구현합니다.
 * CaslAbilityGuard는 글로벌로 등록되어 모든 엔드포인트에 적용됩니다.
 * 단, @CheckAbility() 데코레이터가 없는 엔드포인트는 open으로 간주하여 통과합니다.
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

    // 글로벌 Guard 등록
    {
      provide: APP_GUARD,
      useClass: CaslAbilityGuard,
    },
  ],
  exports: [
    DefineAbilitiesService,
    CaslAbilityFactory,
    CaslAbilityGuard,
    CaslPolicy,
  ],
})
export class CaslModule {}
