/**
 * 소켓 룸(채널) 상수
 */
export const SOCKET_ROOMS = {
    ADMIN: 'admin',
    LOBBY: 'lobby',
    GLOBAL: 'global',
} as const;

export type SocketRoomType =
    | (typeof SOCKET_ROOMS)[keyof typeof SOCKET_ROOMS]
    | `user:${string}`
    | `admin:${string}`

/**
 * 동적 소켓 룸 이름을 생성하는 헬퍼 유틸리티
 */
export const getSocketRoom = {
    /** 유저 개인 룸 (1:1 알림용) */
    user: (userId: bigint) => `user:${userId.toString()}`,

    /** 어드민 개인 룸 (1:1 알림용) */
    admin: (adminId: bigint) => `admin:${adminId.toString()}`,
};
