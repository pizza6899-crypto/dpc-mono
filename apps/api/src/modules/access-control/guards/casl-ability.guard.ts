import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { DefineAbilitiesService } from '../application/define-abilities.service';
import {
  CHECK_ABILITY_KEY,
  type CheckAbilityMetadata,
} from '../decorators/check-ability.decorator';
import { InsufficientPermissionException } from '../domain';

/**
 * CASL 기반 권한 검증 Guard
 *
 * `@CheckAbility()` 데코레이터와 함께 사용하여 엔드포인트 접근 권한을 검증합니다.
 */
@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly defineAbilitiesService: DefineAbilitiesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 메타데이터에서 권한 요구사항 추출
    const requiredAbility =
      this.reflector.getAllAndOverride<CheckAbilityMetadata>(
        CHECK_ABILITY_KEY,
        [context.getHandler(), context.getClass()],
      );

    // 권한 검증이 필요하지 않은 경우 (데코레이터 없음)
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
