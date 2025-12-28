/**
 * CASL 권한 타입 정의
 *
 * 순수 TypeScript 타입만 사용 (CASL 라이브러리 의존 없음)
 */

/**
 * 리소스 타입 (Subject)
 */
export enum SubjectType {
  USER = 'User',
  AFFILIATE_CODE = 'AffiliateCode',
  AFFILIATE_COMMISSION = 'AffiliateCommission',
  AFFILIATE_TIER = 'AffiliateTier',
  AFFILIATE_WALLET = 'AffiliateWallet',
  AFFILIATE_REFERRAL = 'AffiliateReferral',
  COMMISSION = 'Commission',
  EXCHANGE_RATE = 'ExchangeRate',
  PROMOTION = 'Promotion',
  VIP_MEMBERSHIP = 'VipMembership',
  TRANSACTION = 'Transaction',
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
  ALL = 'all', // 모든 리소스
}

/**
 * 액션 타입
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

