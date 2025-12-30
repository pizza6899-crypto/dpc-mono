/**
 * 세션 타입
 *
 * 지원하는 프로토콜/채널별 세션 타입을 정의합니다.
 */
export enum SessionType {
  /**
   * HTTP 세션 (Express Session)
   * 일반적인 웹 요청/응답 기반 세션
   */
  HTTP = 'HTTP',

  /**
   * WebSocket 세션 (Socket.io)
   * 실시간 양방향 통신 세션
   */
  WEBSOCKET = 'WEBSOCKET',

  /**
   * 향후 확장 가능한 타입들
   * - GRPC: gRPC 연결 세션
   * - GRAPHQL_SUBSCRIPTION: GraphQL Subscription 세션
   * - SSE: Server-Sent Events 세션
   */
}

