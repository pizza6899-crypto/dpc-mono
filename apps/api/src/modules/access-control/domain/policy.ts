import { Injectable } from '@nestjs/common';
import { UserRoleType } from '@prisma/client';
import { Action, Permission, SubjectType } from './model/ability.types';

/**
 * CASL 권한 정책
 *
 * 역할별 권한 정의 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class CaslPolicy {
    /**
     * 역할별 기본 권한 정의
     *
     * @param role - 사용자 역할
     * @returns 권한 목록
     */
    defineRolePermissions(role: UserRoleType): Permission[] {
        switch (role) {
            case UserRoleType.SUPER_ADMIN:
                return this.defineSuperAdminPermissions();
            case UserRoleType.ADMIN:
                return this.defineAdminPermissions();
            case UserRoleType.AGENT:
                return this.defineAgentPermissions();
            case UserRoleType.USER:
                return this.defineUserPermissions();
            default:
                return [];
        }
    }

    /**
     * SUPER_ADMIN 권한: 모든 리소스에 대한 모든 액션
     */
    private defineSuperAdminPermissions(): Permission[] {
        return [
            {
                action: Action.MANAGE,
                subject: 'all',
            },
        ];
    }

    /**
     * ADMIN 권한: 대부분의 리소스 관리 (일부 제한)
     */
    private defineAdminPermissions(): Permission[] {
        return [
            // 사용자 관리
            {
                action: [Action.READ, Action.UPDATE],
                subject: SubjectType.User,
            },
            // 어필리에이트 관리
            {
                action: Action.MANAGE,
                subject: SubjectType.AffiliateCode,
            },
            {
                action: Action.MANAGE,
                subject: SubjectType.AffiliateCommission,
            },
            {
                action: Action.MANAGE,
                subject: SubjectType.AffiliateWallet,
            },
            {
                action: Action.MANAGE,
                subject: SubjectType.Referral,
            },
            // 거래 관리
            {
                action: [Action.READ, Action.UPDATE],
                subject: SubjectType.DepositDetail,
            },
            {
                action: [Action.READ, Action.UPDATE],
                subject: SubjectType.WithdrawalDetail,
            },
            // 환율 관리
            {
                action: Action.MANAGE,
                subject: SubjectType.ExchangeRate,
            },
            // 프로모션 관리
            {
                action: Action.MANAGE,
                subject: SubjectType.Promotion,
            },
            // VIP 관리
            {
                action: [Action.READ, Action.UPDATE],
                subject: SubjectType.UserTier,
            },
        ];
    }

    /**
     * AGENT 권한: 어필리에이트 관련 리소스만 관리
     */
    private defineAgentPermissions(): Permission[] {
        return [
            {
                action: Action.MANAGE,
                subject: SubjectType.AffiliateCode,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.AffiliateCommission,
                conditions: { affiliateId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.AffiliateWallet,
                conditions: { affiliateId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.Referral,
                conditions: { affiliateId: '${user.id}' },
            },
        ];
    }

    /**
     * USER 권한: 기본 읽기 및 자신의 리소스만 관리
     */
    private defineUserPermissions(): Permission[] {
        return [
            {
                action: [Action.READ, Action.UPDATE],
                subject: SubjectType.User,
                conditions: { id: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.UserWalletTransaction,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.DepositDetail,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.WithdrawalDetail,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.Promotion,
            },
            {
                action: Action.READ,
                subject: SubjectType.UserTier,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.ExchangeRate,
            },
            {
                action: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
                subject: SubjectType.AffiliateCode,
                conditions: { userId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.AffiliateCommission,
                conditions: { affiliateId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.AffiliateWallet,
                conditions: { affiliateId: '${user.id}' },
            },
            {
                action: Action.READ,
                subject: SubjectType.Referral,
                conditions: { affiliateId: '${user.id}' },
            },
        ];
    }
}
