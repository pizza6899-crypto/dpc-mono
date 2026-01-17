import { Injectable } from '@nestjs/common';
import { UserRoleType } from 'src/generated/prisma';
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
   *
   * CASL에서 'all'은 모든 리소스 타입을 의미하며,
   * Action.MANAGE는 모든 액션(CREATE, READ, UPDATE, DELETE 등)을 의미합니다.
   * 따라서 이 한 줄로 모든 권한을 허용합니다.
   */
  private defineSuperAdminPermissions(): Permission[] {
    return [
      {
        action: Action.MANAGE,
        subject: 'all', // 모든 리소스에 대한 모든 액션
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
        subject: SubjectType.USER,
      },
      // 어필리에이트 관리
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_CODE,
      },
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_COMMISSION,
      },
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_TIER,
      },
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_WALLET,
      },
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_REFERRAL,
      },
      // 거래 관리
      {
        action: [Action.READ, Action.UPDATE],
        subject: SubjectType.DEPOSIT,
      },
      {
        action: [Action.READ, Action.UPDATE],
        subject: SubjectType.WITHDRAW,
      },
      // 환율 관리
      {
        action: Action.MANAGE,
        subject: SubjectType.EXCHANGE_RATE,
      },
      // 프로모션 관리
      {
        action: Action.MANAGE,
        subject: SubjectType.PROMOTION,
      },
      // VIP 관리
      {
        action: [Action.READ, Action.UPDATE],
        subject: SubjectType.VIP_MEMBERSHIP,
      },
    ];
  }

  /**
   * AGENT 권한: 어필리에이트 관련 리소스만 관리
   */
  private defineAgentPermissions(): Permission[] {
    return [
      // 자신의 어필리에이트 코드 관리
      {
        action: Action.MANAGE,
        subject: SubjectType.AFFILIATE_CODE,
        conditions: { userId: '${user.id}' }, // 자신의 코드만
      },
      // 자신의 커미션 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_COMMISSION,
        conditions: { affiliateId: '${user.id}' },
      },
      // 자신의 티어 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_TIER,
        conditions: { affiliateId: '${user.id}' },
      },
      // 자신의 월렛 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_WALLET,
        conditions: { affiliateId: '${user.id}' },
      },
      // 자신의 레퍼럴 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_REFERRAL,
        conditions: { affiliateId: '${user.id}' },
      },
    ];
  }

  /**
   * USER 권한: 기본 읽기 및 자신의 리소스만 관리
   *
   * CASL은 "거부 우선" (deny-by-default) 정책을 따릅니다.
   * 즉, 명시적으로 허용하지 않은 권한은 모두 거부됩니다.
   * 따라서 USER는 허용할 권한만 세세하게 명시해야 합니다.
   */
  private defineUserPermissions(): Permission[] {
    return [
      // 자신의 정보 조회/수정
      {
        action: [Action.READ, Action.UPDATE],
        subject: SubjectType.USER,
        conditions: { id: '${user.id}' },
      },
      // 자신의 거래 조회
      {
        action: Action.READ,
        subject: SubjectType.TRANSACTION,
        conditions: { userId: '${user.id}' },
      },
      // 자신의 입출금 조회
      {
        action: Action.READ,
        subject: SubjectType.DEPOSIT,
        conditions: { userId: '${user.id}' },
      },
      {
        action: Action.READ,
        subject: SubjectType.WITHDRAW,
        conditions: { userId: '${user.id}' },
      },
      // 프로모션 조회 (공개 정보)
      {
        action: Action.READ,
        subject: SubjectType.PROMOTION,
      },
      // 자신의 VIP 멤버십 조회
      {
        action: Action.READ,
        subject: SubjectType.VIP_MEMBERSHIP,
        conditions: { userId: '${user.id}' },
      },
      // 환율 조회 (공개 정보)
      {
        action: Action.READ,
        subject: SubjectType.EXCHANGE_RATE,
      },
      // 자신의 어필리에이트 코드 관리
      {
        action: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
        subject: SubjectType.AFFILIATE_CODE,
        conditions: { userId: '${user.id}' },
      },
      // 자신의 어필리에이트 커미션 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_COMMISSION,
        conditions: { affiliateId: '${user.id}' },
      },
      // 자신의 어필리에이트 월렛 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_WALLET,
        conditions: { affiliateId: '${user.id}' },
      },
      // 자신의 어필리에이트 레퍼럴 조회
      {
        action: Action.READ,
        subject: SubjectType.AFFILIATE_REFERRAL,
        conditions: { affiliateId: '${user.id}' },
      },
    ];
  }
}

