import { Injectable } from '@nestjs/common';
import {
    Ability,
    AbilityBuilder,
    AbilityClass,
    ExtractSubjectType,
    MongoAbility,
} from '@casl/ability';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { Action, Permission, SubjectType } from '../domain';
import type { Subjects } from '../domain';

/**
 * CASL Ability 타입 정의
 */
export type AppAbility = MongoAbility<[Action, Subjects]>;

/**
 * CASL AbilityFactory
 *
 * CASL 라이브러리를 사용하여 Ability 객체를 생성합니다.
 */
@Injectable()
export class CaslAbilityFactory {
    /**
     * 사용자와 권한 정의를 기반으로 CASL Ability 생성
     *
     * @param user - 인증된 사용자
     * @param permissions - 권한 정의 목록
     * @returns CASL Ability 객체
     */
    create(user: AuthenticatedUser, permissions: Permission[]): AppAbility {
        const { can, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        // 권한 정의를 CASL 규칙으로 변환
        for (const permission of permissions) {
            const actions = Array.isArray(permission.action)
                ? permission.action
                : [permission.action];

            for (const action of actions) {
                if (permission.conditions) {
                    // 조건부 권한 (예: 자신의 리소스만)
                    const conditions = this.resolveConditions(
                        permission.conditions,
                        user,
                    );
                    can(action, permission.subject, conditions);
                } else {
                    // 무조건 권한
                    can(action, permission.subject);
                }
            }
        }

        return build({
            detectSubjectType: (item: any) =>
                item.constructor as ExtractSubjectType<Subjects>,
        });
    }

    /**
     * 조건부 권한의 조건을 사용자 정보로 해석
     *
     * @param conditions - 조건 객체 (템플릿 문자열 포함 가능)
     * @param user - 인증된 사용자
     * @returns 해석된 조건 객체
     */
    private resolveConditions(
        conditions: Record<string, any>,
        user: AuthenticatedUser,
    ): Record<string, any> {
        const resolved: Record<string, any> = {};

        for (const [key, value] of Object.entries(conditions)) {
            if (typeof value === 'string' && value.startsWith('${user.')) {
                // 템플릿 문자열 해석 (예: '${user.id}' -> user.id)
                const property = value.slice(7, -1); // '${user.' 와 '}' 제거
                resolved[key] = (user as any)[property];
            } else {
                resolved[key] = value;
            }
        }

        return resolved;
    }
}
