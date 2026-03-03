import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DefineAbilitiesService } from './application/define-abilities.service';
import { CaslPolicy } from './domain';
import { CaslAbilityFactory } from './infrastructure/casl-ability.factory';
import { CaslAbilityGuard } from './guards/casl-ability.guard';

/**
 * Access Control 모듈
 *
 * CASL 라이브러리를 통해 속성 기반 접근 제어(ABAC)를 구현합니다.
 */
@Module({
    providers: [
        CaslPolicy,
        CaslAbilityFactory,
        DefineAbilitiesService,
        CaslAbilityGuard,
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
export class AccessControlModule { }
