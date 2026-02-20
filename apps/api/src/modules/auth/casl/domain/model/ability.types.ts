/**
 * CASL 권한 타입 정의
 *
 * 순수 TypeScript 타입만 사용 (CASL 라이브러리 의존 없음)
 */

/**
 * 리소스 타입 (Subject)
 *
 * 권한 관리가 필요한 주요 비즈니스 리소스를 정의합니다.
 * 내부 관리용 리소스(UserBalance, UserSession 등)는 제외합니다.
 */
export enum SubjectType {
  USER = 'User',
  AFFILIATE_CODE = 'AffiliateCode',
  AFFILIATE_COMMISSION = 'AffiliateCommission',
  AFFILIATE_TIER = 'AffiliateTier',
  AFFILIATE_WALLET = 'AffiliateWallet',
  AFFILIATE_REFERRAL = 'AffiliateReferral',
  EXCHANGE_RATE = 'ExchangeRate',
  PROMOTION = 'Promotion',
  VIP_MEMBERSHIP = 'VipMembership',
  TRANSACTION = 'Transaction',
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
}

/**
 * 액션 타입
 *
 * CASL 표준 액션을 따릅니다.
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // 모든 액션 (CRUD + 기타)
}

/**
 * Subject 타입 (리소스 타입 또는 'all')
 *
 * CASL에서는 'all'을 문자열 리터럴로 사용하여 모든 리소스를 나타냅니다.
 * SubjectType enum에는 포함하지 않고 타입에서만 허용합니다.
 */
export type Subjects = SubjectType | 'all';

/**
 * 권한 정의 인터페이스
 */
export interface Permission {
  action: Action | Action[];
  subject: Subjects;
  conditions?: Record<string, any>; // 조건부 권한 (예: 자신의 리소스만 수정 가능)
}
