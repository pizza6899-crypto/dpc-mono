import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/redis.service';
import { Server } from 'socket.io';
import { SessionType } from '../domain';

/**
 * 세션 트래커 서비스
 *
 * Redis 세션 스토어와 WebSocket 연결을 관리합니다.
 * 
 * 사용 케이스:
 * 1. 특정 세션 종료: 관리자가 특정 유저의 특정 세션 종료 또는 유저가 로그인 처리
 *    - 해당 세션 종료 처리 및 해당 세션으로 기인한 소켓 종료 처리
 * 2. 특정 유저의 전체 로그아웃: 관리자가 특정 유저의 전체 로그아웃 또는 밴 등 상태변화, 유저의 탈퇴 등
 *    - 해당 유저의 모든 활성 세션을 가져와서 세션 종료 순회
 */
@Injectable()
export class SessionTrackerService {
  private readonly logger = new Logger(SessionTrackerService.name);
  private websocketServer: Server | null = null;

  constructor(
    private readonly redisService: RedisService,
  ) {}

  /**
   * WebSocket 서버 등록
   * WebSocketGateway에서 초기화 시 호출
   */
  setWebSocketServer(server: Server): void {
    this.websocketServer = server;
  }

  /**
   * 특정 세션 종료
   * 
   * 케이스 1: 관리자가 특정 유저의 특정 세션 명시적 종료 또는 유저가 로그인 처리
   * - 해당 세션 종료 처리 및 해당 세션으로 기인한 소켓 종료 처리
   * 
   * HTTP 세션: Redis에서 세션 삭제
   * WebSocket 세션: sessionId Room의 모든 소켓 연결 해제
   * 
   * Redis 어댑터를 사용하는 다중 인스턴스 환경에서도 모든 서버 인스턴스의
   * 해당 세션 소켓이 함께 끊깁니다.
   *
   * @param sessionId - 세션 ID (HTTP: Express session ID, WebSocket: 세션 UID)
   * @param type - 세션 타입
   * @param isAdmin - 관리자 세션인지 여부 (HTTP 세션인 경우만 사용)
   * @throws {Error} sessionId가 유효하지 않은 경우
   */
  async terminateSession(
    sessionId: string,
    type: SessionType,
    isAdmin: boolean = false,
  ): Promise<void> {
    // 입력 검증
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      this.logger.warn(`유효하지 않은 sessionId: ${sessionId}`);
      return;
    }

    // 세션 타입별 처리
    switch (type) {
      case SessionType.HTTP:
        await this.deleteHttpSession(sessionId, isAdmin);
        break;
      case SessionType.WEBSOCKET:
        await this.disconnectSessionSockets(sessionId);
        break;
      default:
        this.logger.warn(
          `지원하지 않는 세션 타입: ${type}, sessionId=${sessionId}`,
        );
    }
  }

  /**
   * HTTP 세션 삭제 (Redis)
   * 
   * @private
   */
  private async deleteHttpSession(sessionId: string, isAdmin: boolean = false): Promise<void> {
    const prefix = isAdmin ? 'admin-sess:' : 'sess:';
    const redisKey = `${prefix}${sessionId}`;

    try {
      const deleted = await this.redisService.del(redisKey);
      if (deleted) {
        this.logger.log(
          `Redis 세션 삭제 완료: sessionId=${sessionId}, isAdmin=${isAdmin}`,
        );
      } else {
        // 세션이 이미 삭제되었거나 존재하지 않는 경우는 정상적인 상황일 수 있음
        // (예: 이미 만료되었거나 다른 프로세스에서 삭제)
        this.logger.debug(
          `Redis 세션을 찾을 수 없음 (이미 삭제되었을 수 있음): sessionId=${sessionId}, isAdmin=${isAdmin}`,
        );
      }
    } catch (error) {
      // Redis 연결 실패 등 심각한 에러는 로깅하지만 예외를 던지지 않음
      // 세션 종료는 DB 업데이트가 완료되었으므로 성공 처리
      this.logger.error(
        error,
        `Redis 세션 삭제 실패: sessionId=${sessionId}, isAdmin=${isAdmin}`,
      );
      // 에러가 발생해도 계속 진행 (세션 만료는 성공 처리)
    }
  }

  /**
   * 특정 세션의 모든 WebSocket 연결 해제
   * 
   * WebSocket 연결 시 sessionId Room에 조인되어 있다고 가정합니다.
   * 
   * @private
   */
  private async disconnectSessionSockets(sessionId: string): Promise<void> {
    if (!this.websocketServer) {
      // WebSocket 서버가 초기화되지 않은 경우는 정상적인 상황일 수 있음
      // (예: WebSocket 기능이 비활성화되었거나 아직 초기화되지 않음)
      this.logger.debug(
        `WebSocket 서버가 초기화되지 않음: sessionId=${sessionId}`,
      );
      return;
    }

    try {
      // sessionId를 Room 이름으로 사용하여 해당 세션의 모든 소켓 연결 해제
      // Redis 어댑터를 통해 모든 서버 인스턴스의 해당 세션 소켓이 함께 끊김
      await this.websocketServer
        .in(sessionId)
        .disconnectSockets(true);

      this.logger.log(
        `세션의 모든 WebSocket 연결 해제 완료: sessionId=${sessionId}`,
      );
    } catch (error) {
      // WebSocket 연결 해제 실패는 로깅하지만 예외를 던지지 않음
      // 세션 종료는 DB 업데이트가 완료되었으므로 성공 처리
      this.logger.error(
        error,
        `세션의 모든 WebSocket 연결 해제 실패: sessionId=${sessionId}`,
      );
      // 에러가 발생해도 계속 진행 (세션 만료는 성공 처리)
    }
  }
}

