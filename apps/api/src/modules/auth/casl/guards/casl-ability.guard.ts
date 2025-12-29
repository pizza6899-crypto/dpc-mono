import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { DefineAbilitiesService } from '../application/define-abilities.service';
import {
  CHECK_ABILITY_KEY,
  type CheckAbilityMetadata,
} from '../decorators/check-ability.decorator';
import { InsufficientPermissionException } from '../domain';
import type { AppAbility } from '../infrastructure/casl-ability.factory';

/**
 * CASL 기반 권한 검증 Guard
 *
 * `@CheckAbility()` 데코레이터와 함께 사용하여 엔드포인트 접근 권한을 검증합니다.
 *
 * 동작 방식:
 * 1. @CheckAbility() 데코레이터가 없는 엔드포인트는 open으로 간주하여 통과 (인증 불필요)
 * 2. @CheckAbility() 데코레이터가 있는 엔드포인트는:
 *    - 사용자 인증 확인 (인증되지 않은 경우 ForbiddenException)
 *    - 사용자별 Ability 생성
 *    - 권한 검증 (권한이 없는 경우 InsufficientPermissionException)
 *
 * 글로벌로 등록되어 모든 엔드포인트에 적용되지만,
 * 데코레이터가 없으면 자동으로 통과하므로 기존 엔드포인트에 영향을 주지 않습니다.
 */
@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly defineAbilitiesService: DefineAbilitiesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 메타데이터에서 권한 요구사항 추출
    const requiredAbility = this.reflector.getAllAndOverride<CheckAbilityMetadata>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 권한 검증이 필요하지 않은 경우 (데코레이터 없음)
    // @CheckAbility() 데코레이터가 없는 엔드포인트는 open으로 간주하여 통과
    if (!requiredAbility) {
      return true;
    }

    // 2. 요청에서 사용자 정보 추출
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 3. 사용자별 Ability 생성
    const ability = await this.defineAbilitiesService.execute(user);

    // 4. 권한 검증
    const canAccess = ability.can(
      requiredAbility.action,
      requiredAbility.subject,
    );

    if (!canAccess) {
      throw new InsufficientPermissionException(
        requiredAbility.action,
        requiredAbility.subject,
      );
    }

    // 5. Ability를 request에 저장 (컨트롤러에서 사용 가능)
    (request as any).ability = ability;

    return true;
  }
}

