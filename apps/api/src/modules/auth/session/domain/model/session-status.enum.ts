/**
 * 세션 상태
 *
 * 세션의 생명주기 상태를 나타냅니다.
 */
export enum SessionStatus {
  /**
   * 활성 상태
   * 정상적으로 사용 중인 세션
   */
  ACTIVE = 'ACTIVE',

  /**
   * 명시적으로 종료된 세션
   * 사용자 또는 관리자가 로그아웃하거나 세션을 종료한 경우
   */
  REVOKED = 'REVOKED',

  /**
   * 만료된 세션
   * expiresAt 시간이 지나 자동으로 만료된 세션
   */
  EXPIRED = 'EXPIRED',
}
