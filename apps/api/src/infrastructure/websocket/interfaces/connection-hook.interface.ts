import { Socket } from 'socket.io';

/**
 * 웹소켓 연결 시 실행할 훅 인터페이스
 */
export interface OnWebsocketConnectHook {
  /**
   * 커넥션 성공 시 호출됩니다.
   * @param client 연결된 소켓 클라이언트
   * @param userId 유저 ID
   * @param isAdmin 관리자 여부
   */
  onConnect(client: Socket, userId: bigint, isAdmin: boolean): Promise<void>;
}

/** 훅 등록을 위한 Injection Token */
export const WS_CONNECT_HOOK = Symbol('WS_CONNECT_HOOK');
