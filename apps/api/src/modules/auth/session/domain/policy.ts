import { Injectable } from '@nestjs/common';
import { UserSession } from './model';
import { MultipleLoginNotAllowedException } from './exception';

/**
 * Session 도메인 정책
 *
 * 세션 관리 관련 비즈니스 규칙을 담당합니다.
 * - 다중 로그인 허용 여부
 * - 최대 동시 세션 수
 * - 디바이스 타입별 제한 (PC/모바일 각각)
 * - 세션 생성/종료 정책
 */
@Injectable()
export class SessionPolicy {
  /**
   * 다중 로그인 허용 여부
   * false인 경우, 새 로그인 시 기존 모든 활성 세션을 종료합니다.
   */
  private readonly ALLOW_MULTIPLE_LOGIN = false;

  /**
   * 전체 최대 동시 세션 수
   * 다중 로그인이 허용된 경우에도 이 수를 초과할 수 없습니다.
   */
  private readonly MAX_CONCURRENT_SESSIONS = 2; // PC 1개(HTTP+WS) + 모바일 1개(HTTP+WS)

  /**
   * PC 디바이스 최대 세션 수
   * 로그인 시 HTTP + WebSocket 세션이 함께 생성되므로 실제로는 2개 세션이 생성됩니다.
   */
  private readonly MAX_PC_SESSIONS = 1;

  /**
   * 모바일 디바이스 최대 세션 수
   * 로그인 시 HTTP + WebSocket 세션이 함께 생성되므로 실제로는 2개 세션이 생성됩니다.
   */
  private readonly MAX_MOBILE_SESSIONS = 1;

  /**
   * 다중 로그인이 허용되는지 확인
   */
  isMultipleLoginAllowed(): boolean {
    return this.ALLOW_MULTIPLE_LOGIN;
  }

  /**
   * 최대 동시 세션 수 조회 (전체)
   */
  getMaxConcurrentSessions(): number {
    return this.MAX_CONCURRENT_SESSIONS;
  }

  /**
   * 새 세션 생성 가능 여부 검증
   *
   * @param existingActiveSessions - 기존 활성 세션 목록
   * @param isMobile - 새로 생성할 세션이 모바일 디바이스인지 여부
   * @throws {MultipleLoginNotAllowedException} 다중 로그인이 허용되지 않고 기존 세션이 있는 경우
   */
  canCreateNewSession(
    existingActiveSessions: UserSession[],
    isMobile: boolean,
  ): void {
    const activeSessions = existingActiveSessions.filter((session) =>
      session.isActive(),
    );
    const activeSessionCount = activeSessions.length;

    // 다중 로그인이 허용되지 않은 경우
    if (!this.isMultipleLoginAllowed()) {
      if (activeSessionCount > 0) {
        throw new MultipleLoginNotAllowedException(activeSessionCount);
      }
      return;
    }

    // 디바이스 타입별 제한 확인
    const maxSessionsForDeviceType = this.getMaxSessionsByDeviceType(isMobile);
    const sameDeviceTypeSessions = activeSessions.filter(
      (session) => session.deviceInfo.isMobile === isMobile,
    );

    if (sameDeviceTypeSessions.length >= maxSessionsForDeviceType) {
      const deviceType = isMobile ? 'mobile' : 'PC';
      throw new MultipleLoginNotAllowedException(
        sameDeviceTypeSessions.length,
        `Maximum ${deviceType} device sessions (${maxSessionsForDeviceType}) exceeded. You have ${sameDeviceTypeSessions.length} active ${deviceType} session(s).`,
      );
    }

    // 전체 세션 수 제한 확인
    const maxTotalSessions = this.getMaxConcurrentSessions();
    if (activeSessionCount >= maxTotalSessions) {
      throw new MultipleLoginNotAllowedException(
        activeSessionCount,
        `Maximum concurrent sessions (${maxTotalSessions}) exceeded. You have ${activeSessionCount} active session(s).`,
      );
    }
  }

  /**
   * 새 세션 생성 시 기존 세션 처리 정책
   *
   * 로그인 시 HTTP 세션과 WebSocket 세션이 함께 생성되므로,
   * 같은 디바이스 타입의 기존 세션들을 종료해야 합니다.
   *
   * @param existingActiveSessions - 기존 활성 세션 목록
   * @param isMobile - 새로 생성할 세션이 모바일 디바이스인지 여부
   * @returns 종료해야 할 세션 목록
   */
  getSessionsToRevokeForNewLogin(
    existingActiveSessions: UserSession[],
    isMobile: boolean,
  ): UserSession[] {
    const activeSessions = existingActiveSessions.filter((session) =>
      session.isActive(),
    );

    // 다중 로그인이 허용되지 않은 경우, 모든 기존 세션 종료
    if (!this.isMultipleLoginAllowed()) {
      return activeSessions;
    }

    // 같은 디바이스 타입의 세션 필터링
    const sameDeviceTypeSessions = activeSessions.filter(
      (session) => session.deviceInfo.isMobile === isMobile,
    );

    // 디바이스 타입별 제한 확인
    const maxSessionsForDeviceType = this.getMaxSessionsByDeviceType(isMobile);

    // 같은 디바이스 타입의 세션이 최대치에 도달한 경우
    if (sameDeviceTypeSessions.length >= maxSessionsForDeviceType) {
      // 오래된 세션부터 정렬 (lastActiveAt 기준)
      const sortedSessions = [...sameDeviceTypeSessions].sort(
        (a, b) =>
          a.lastActiveAt.getTime() - b.lastActiveAt.getTime(),
      );

      // 초과하는 세션 수만큼 종료
      // 로그인 시 HTTP + WebSocket이 함께 생성되므로, 기존 세션도 모두 종료
      const excessCount =
        sameDeviceTypeSessions.length - maxSessionsForDeviceType + 1;
      return sortedSessions.slice(0, excessCount);
    }

    // 전체 세션 수 제한 확인
    const maxTotalSessions = this.getMaxConcurrentSessions();
    if (activeSessions.length >= maxTotalSessions) {
      // 오래된 세션부터 정렬 (lastActiveAt 기준)
      const sortedSessions = [...activeSessions].sort(
        (a, b) =>
          a.lastActiveAt.getTime() - b.lastActiveAt.getTime(),
      );

      // 초과하는 세션 수만큼 종료
      const excessCount = activeSessions.length - maxTotalSessions + 1;
      return sortedSessions.slice(0, excessCount);
    }

    return [];
  }

  /**
   * 디바이스 타입별 최대 세션 수 조회
   * PC와 모바일 각각 다른 제한을 둘 수 있습니다.
   *
   * @param isMobile - 모바일 디바이스인지 여부
   * @returns 최대 세션 수
   */
  getMaxSessionsByDeviceType(isMobile: boolean): number {
    return isMobile ? this.MAX_MOBILE_SESSIONS : this.MAX_PC_SESSIONS;
  }
}

